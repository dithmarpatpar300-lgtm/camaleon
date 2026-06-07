import type { ReactNode } from "react";

type LegalPageShellProps = {
  children: ReactNode;
};

export function LegalPageShell({ children }: LegalPageShellProps) {
  return (
    <div className="legal-page relative overflow-hidden px-6 py-10 sm:py-14">
      <div className="legal-page-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">{children}</div>
    </div>
  );
}
