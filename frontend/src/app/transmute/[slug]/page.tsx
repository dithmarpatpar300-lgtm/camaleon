import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getToolBySlug, getActiveTools } from "@/lib/tools/tool-registry";
import { Badge } from "@/components/ui/Badge";
import { TransmutationPanel } from "@/components/transmute/TransmutationPanel";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getActiveTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.status !== "active") {
    return { title: "Not Found — Camaleon" };
  }
  return {
    title: `${tool.title} — Camaleon`,
    description: tool.description,
  };
}

export default async function TransmuteToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || tool.status !== "active") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-secondary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z"
            clipRule="evenodd"
          />
        </svg>
        Transmutaciones
      </Link>

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">
            {tool.title}
          </h1>
          <Badge
            variant={tool.fidelity === "lossless" ? "lossless" : "lossy"}
          >
            {tool.fidelity === "lossless" ? "Sin pérdida" : "Con pérdida"}
          </Badge>
        </div>
        <p className="text-text-secondary">{tool.description}</p>
        {tool.fidelityHint && (
          <p className="mt-2 text-sm text-text-muted">{tool.fidelityHint}</p>
        )}
      </div>

      <TransmutationPanel tool={tool} />
    </div>
  );
}
