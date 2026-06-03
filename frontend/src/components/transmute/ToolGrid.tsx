import { getActiveTools, getSoonTools } from "@/lib/tools/tool-registry";
import { ToolCard } from "./ToolCard";

export function ToolGrid() {
  const activeTools = getActiveTools();
  const soonTools = getSoonTools();

  return (
    <section className="mx-auto max-w-4xl px-6 pb-20">
      <h2 className="mb-6 text-xl font-semibold text-text-primary">
        Transmutaciones disponibles
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {activeTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
      {soonTools.length > 0 && (
        <>
          <h3 className="mb-4 mt-10 text-sm font-medium text-text-muted">
            Próximamente
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {soonTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
