import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getToolBySlug, getActiveTools } from "@/lib/tools/tool-registry";
import { TransmutationPanel } from "@/components/transmute/TransmutationPanel";
import { ToolPageStrings } from "./ToolPageStrings";
import { ToolPageBack } from "./ToolPageBack";

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
      <ToolPageBack />

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">{tool.title}</h1>
          <ToolPageStrings toolId={tool.id} />
        </div>
        <ToolPageStrings toolId={tool.id} showDescription />
        <ToolPageStrings toolId={tool.id} showHint />
      </div>

      <TransmutationPanel tool={tool} />
    </div>
  );
}
