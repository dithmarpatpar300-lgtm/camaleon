import Link from "next/link";
import type { ToolDefinition } from "@/lib/tools/types";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";

type ToolCardProps = {
  tool: ToolDefinition;
};

export function ToolCard({ tool }: ToolCardProps) {
  const isActive = tool.status === "active";

  const content = (
    <Card
      className={
        "flex h-full flex-col " +
        (isActive ? "group transition-shadow hover:shadow-lg hover:shadow-accent/5" : "opacity-50")
      }
    >
      <CardBody className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-text-primary">
            {tool.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}>
              {tool.fidelity === "lossless" ? "Sin pérdida" : "Con pérdida"}
            </Badge>
            {!isActive && (
              <Badge variant="neutral">Pronto</Badge>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm text-text-secondary flex-1">{tool.description}</p>
        {tool.fidelityHint && (
          <p className="mt-2 text-xs text-text-muted">{tool.fidelityHint}</p>
        )}
        <div className="mt-3 flex h-5 items-center gap-1 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
          <span>Transmutar</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </CardBody>
    </Card>
  );

  if (isActive) {
    return (
      <Link
        href={`/transmute/${tool.slug}`}
        className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
      >
        {content}
      </Link>
    );
  }

  return <div className="cursor-not-allowed">{content}</div>;
}
