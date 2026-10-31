import { Cartao, EstadoVazio } from "./Layout.jsx";

// columns: [{ key, label, render?(row) }] — actions?(row) devolve os botões da linha
export function TabelaDados({ columns: colunas, rows: linhas, rowKey: chaveLinha = "id", actions: acoes, empty: vazio }) {
  return (
    <Cartao className="overflow-hidden">
      {linhas.length === 0 ? (
        vazio || <EstadoVazio title="Nada por aqui">Nenhum registro encontrado.</EstadoVazio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-table text-left text-sm">
            <thead className="bg-brand-soft text-brand">
              <tr>
                {colunas.map((coluna) => <th key={coluna.key} className="px-5 py-4 font-bold">{coluna.label}</th>)}
                {acoes && <th className="px-5 py-4 font-bold">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {linhas.map((linha) => (
                <tr key={linha[chaveLinha]} className="hover:bg-canvas">
                  {colunas.map((coluna) => <td key={coluna.key} className="px-5 py-4">{coluna.render ? coluna.render(linha) : linha[coluna.key]}</td>)}
                  {acoes && <td className="px-5 py-3"><div className="flex gap-1">{acoes(linha)}</div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Cartao>
  );
}
