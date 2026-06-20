"use client";

import { useI18n } from "@/providers/I18nProvider";

type LegalTableProps = {
  headers: string[];
  rows: string[][];
};

function renderCell(cell: string, columnIndex: number) {
  if (columnIndex === 0) {
    return (
      <code className="legal-table-key" title={cell}>
        {cell}
      </code>
    );
  }

  return <span className="legal-table-purpose">{cell}</span>;
}

export function LegalTable({ headers, rows }: LegalTableProps) {
  const { t } = useI18n();
  const label = headers.join(" · ");
  const countLabel =
    rows.length === 1
      ? t("legal.tableEntry", { count: String(rows.length) })
      : t("legal.tableEntries", { count: String(rows.length) });

  return (
    <div className="legal-table-shell" role="region" aria-label={label}>
      <div className="legal-table-toolbar">
        <span className="legal-table-toolbar-label">{label}</span>
        <span className="legal-table-toolbar-count">{countLabel}</span>
      </div>

      <div className="legal-table-scroll">
        <table className="legal-table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("|").slice(0, 80)}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cellIndex}-${cell.slice(0, 32)}`} data-col={headers[cellIndex]}>
                    {renderCell(cell, cellIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
