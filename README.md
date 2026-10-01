# Statement Index — frontend

A single-page dashboard for searching public GitHub repositories. **No server,
no backend, no API key.** Searches go from the browser straight to GitHub's
public search API.

The repository root `README.md` is the full write-up. This file is the
short version for anyone working in this folder.

## Quick start

```bash
npm ci
npm run dev        # http://localhost:5173
```

```bash
npm run build      # -> dist/
npx serve dist     # serve the static output
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | `tsc -b` then `vite build` into `dist/` |
| `npm run preview` | Serve the built `dist/` |
| `npm run lint` | oxlint |

## Deploying

`dist/` is entirely static. Build it and point any static host at that folder —
GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, or a plain Nginx directory.
Publish root is **`dist`**, not the repository root.

No rewrite rules: one page, no client-side router, one route.

GitHub Pages subpaths work. The GitHub URL is built from a fixed
`https://api.github.com` base, not from `window.location`.

## What it costs you

| | |
|---|---|
| Rate limit | **10 req/min, anonymous, shared per IP** |
| Caching | none |
| Code search | **unavailable** — GitHub requires a token |
| Token | **none, ever** |

Everyone behind the same NAT shares that budget. A rate-limited call comes back
as `403`/`429`; the app reads `Retry-After` and tells you how long to wait.

Code search is authenticated-only on GitHub, so the scope control disables
itself with the reason attached instead of throwing a raw `401`.

The legacy `backend/` in the repository root has a token-backed implementation
at 30 req/min with caching, if the limit ever becomes a problem.

## Searching

GitHub's query syntax passes through unchanged. No scope is added by default —
a bare search covers name, description, README and topics. Add `in:readme` or
`in:name` to narrow it. If your query already contains `in:`, the scope control
hides itself, because two `in:` qualifiers is a GitHub syntax error.

`filename:`, `path:` and `extension:` are code-search only and return zero
results silently on a repository search. The syntax panel warns about this.

`/` focuses the box, `Esc` clears it and its results, arrow keys move between
cards.

## Gotchas

- **Typecheck with `npx tsc -b --force`, never `npx tsc --noEmit`.** The root
  `tsconfig.json` is solution-style (`files: []` + project references) and bare
  `tsc` follows no references, so it exits 0 while checking nothing.
- **Never put a secret in a `VITE_`-prefixed variable.** Those are inlined into
  the public bundle. `.env` files are gitignored for this reason.
- **`Cannot find native binding` or `Cannot find module
  '@rolldown/binding-linux-x64-gnu'`** means a platform-specific optional
  dependency is missing:

  ```bash
  rm -rf node_modules && npm install --include=optional
  ```

## Layout

```
src/
  lib/
    api.ts           response types the components read
    githubDirect.ts  the GitHub client: fetch, paging, dedup, error mapping
    starters.ts      grouped starter searches, qualifier reference
    freshness.ts     wording for ages and cache state
    filters.ts       filter state and the scope capability check
  hooks/useSearch.ts debounce, abort, state transitions
  components/        presentational components
  App.tsx            layout and state ownership
```