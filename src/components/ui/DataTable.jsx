import { Card, EmptyState } from "./Layout.jsx";

// columns: [{ key, label, render?(row) }] — actions?(row) devolve os botões da linha
export function DataTable({ columns, rows, rowKey = "id", actions, empty }) {
  return (
    <Card className="overflow-hidden">
      {rows.length === 0 ? (
        empty || <EmptyState title="Nada por aqui">Nenhum registro encontrado.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-table text-left text-sm">
            <thead className="bg-brand-soft text-brand">
              <tr>
                {columns.map((col) => <th key={col.key} className="px-5 py-4 font-bold">{col.label}</th>)}
                {actions && <th className="px-5 py-4 font-bold">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {rows.map((row) => (
                <tr key={row[rowKey]} className="hover:bg-canvas">
                  {columns.map((col) => <td key={col.key} className="px-5 py-4">{col.render ? col.render(row) : row[col.key]}</td>)}
                  {actions && <td className="px-5 py-3"><div className="flex gap-1">{actions(row)}</div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
