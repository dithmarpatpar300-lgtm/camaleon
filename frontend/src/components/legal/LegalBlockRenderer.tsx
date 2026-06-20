import type { LegalBlock } from "@/lib/legal/types";

type LegalBlockRendererProps = {
  block: LegalBlock;
};

export function LegalBlockRenderer({ block }: LegalBlockRendererProps) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="legal-paragraph text-[15px] leading-[1.75] text-text-secondary">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul className="legal-list space-y-2 text-[15px] leading-[1.75] text-text-secondary">
          {block.items.map((item) => (
            <li key={item.slice(0, 64)}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <aside
          className={`legal-callout legal-callout-${block.variant}`}
          role="note"
        >
          {block.title && (
            <p className="legal-callout-title text-sm font-semibold text-text-primary">
              {block.title}
            </p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">{block.text}</p>
        </aside>
      );
    case "table":
      return (
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|").slice(0, 80)}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell.slice(0, 32)}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
