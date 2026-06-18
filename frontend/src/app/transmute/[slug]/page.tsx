import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { getToolBySlug, getActiveTools } from "@/lib/tools/tool-registry";
import { resolveLocaleFromCookie, getToolMetadata, LOCALE_COOKIE_NAME } from "@/lib/i18n/metadata";
import { TransmutationPanel } from "@/components/transmute/TransmutationPanel";
import { ToolPageHeader } from "@/components/transmute/ToolPageHeader";

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
  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return getToolMetadata(locale, tool.id, tool.title);
}

export default async function TransmuteToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || tool.status !== "active") {
    notFound();
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <ToolPageHeader tool={tool} />
      <Suspense fallback={null}>
        <TransmutationPanel tool={tool} />
      </Suspense>
    </div>
  );
}
