import type { ReactNode } from "react";

type LegalPageShellProps = {
  children: ReactNode;
};

export function LegalPageShell({ children }: LegalPageShellProps) {
  return (
    <div className="legal-page px-4 py-8 sm:px-6 sm:py-12">
      <div className="legal-page-inner">{children}</div>
    </div>
  );
}
