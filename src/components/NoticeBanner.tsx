import type { ReactNode } from "react";

const TONES = {
  warn: "notice-banner warn",
  info: "notice-banner info",
  error: "notice-banner error",
} as const;

export function NoticeBanner({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={TONES[tone]}
    >
      {children}
    </div>
  );
}
