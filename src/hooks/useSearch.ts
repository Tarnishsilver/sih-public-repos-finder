import { useCallback, useEffect, useRef, useState } from "react";

import {
  SearchApiError,
  type Scope,
  type SearchResponse,
} from "../lib/api";
import { GitHubDirectError, searchDirect } from "../lib/githubDirect";

export const DEBOUNCE_MS = 400;

export interface SearchState {
  status: "idle" | "loading" | "success" | "error";
  data: SearchResponse | null;
  error: SearchApiError | null;
}

const IDLE: SearchState = { status: "idle", data: null, error: null };

/**
 * Searches go straight to GitHub's public API from the browser. There is no
 * server in this app and no token in the bundle, so the anonymous rate limit
 * (10 req/min, shared per IP) is the whole cost model.
 */
export function useSearch() {
  const [state, setState] = useState<SearchState>(IDLE);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);

  const abortInFlight = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
  }, []);

  // Disarms the debounce as well as the in-flight request. Unmounting inside
  // the 400ms window used to let the timer fire post-unmount, issuing a real
  // request to a rate-limited API that nothing could then cancel.
  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    abortInFlight();
  }, [abortInFlight]);

  useEffect(() => cancel, [cancel]);

  const run = useCallback(
    (q: string, scope: Scope, maxPages: number) => {
      const query = q.trim();
      if (!query) {
        // Disarm before returning. Leaving an armed timer here means it fires
        // for the *previous* query and repopulates results the user just
        // cleared.
        cancel();
        setState(IDLE);
        return;
      }

      cancel();
      setState((prev) => ({ status: "loading", data: prev.data, error: null }));

      timer.current = setTimeout(async () => {
        const local = new AbortController();
        controller.current = local;
        try {
          const data = await searchDirect({
            q: query,
            scope,
            maxPages,
            signal: local.signal,
          });
          if (local.signal.aborted) return;
          setState({ status: "success", data, error: null });
        } catch (cause) {
          if (local.signal.aborted) return;
          if (cause instanceof DOMException && cause.name === "AbortError") return;

          const error =
            cause instanceof GitHubDirectError
              ? new SearchApiError(cause.message, cause.status, cause.retryAfter)
              : new SearchApiError("Something went wrong.", 0, null);
          setState({ status: "error", data: null, error });
        }
      }, DEBOUNCE_MS);
    },
    [cancel],
  );

  const reset = useCallback(() => {
    cancel();
    setState(IDLE);
  }, [cancel]);

  return { state, run, reset };
}
