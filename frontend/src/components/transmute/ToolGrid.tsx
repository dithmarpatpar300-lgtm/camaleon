"use client";

import { useI18n } from "@/providers/I18nProvider";
import { getActiveTools, getSoonTools } from "@/lib/tools/tool-registry";
import { ScrollVeil } from "@/components/ui/ScrollVeil";
import { ToolCard } from "./ToolCard";

export function ToolGrid() {
  const { t } = useI18n();
  const activeTools = getActiveTools();
  const soonTools = getSoonTools();

  return (
    <section className="pb-10">
      <h2 className="mb-6 text-xl font-semibold text-text-primary">
        {t("landing.tools.available")}
      </h2>

      <ScrollVeil variant="main">
        <div className="grid gap-4 pb-2 sm:grid-cols-2">
          {activeTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
        {soonTools.length > 0 && (
          <>
            <h3 className="mb-4 mt-10 text-sm font-medium text-text-muted">
              {t("landing.tools.comingSoon")}
            </h3>
            <div className="grid gap-4 pb-2 sm:grid-cols-2">
              {soonTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </>
        )}
      </ScrollVeil>
    </section>
  );
}
