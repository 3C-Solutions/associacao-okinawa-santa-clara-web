
import { useEffect, useId, useMemo, useState } from "react";

const limparAcentos = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

export default function BuscaReservante({
  label,
  opcoes = [],
  valor,
  onChange,
  erro,
  desabilitado = false,
}) {
  const id = useId();
  const listaId = `${id}-opcoes`;
  const [busca, definirBusca] = useState("");
  const [aberto, definirAberto] = useState(false);

  const selecionado = opcoes.find(
    (opcao) => String(opcao.id) === String(valor)
  );

  useEffect(() => {
    if (selecionado) definirBusca(selecionado.nome);
  }, [selecionado?.nome, valor]);

  const resultados = useMemo(
    () =>
      opcoes
        .filter((opcao) =>
          limparAcentos(opcao.nome).includes(
            limparAcentos(busca.trim())
          )
        )
        .slice(0, 30),
    [busca, opcoes]
  );

  const escolher = (opcao) => {
    onChange(String(opcao.id));
    definirBusca(opcao.nome);
    definirAberto(false);
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-ink"
      >
        {label} <span className="text-danger">*</span>
      </label>

      <input
        id={id}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listaId}
        aria-expanded={aberto}
        aria-invalid={Boolean(erro)}
        autoComplete="off"
        className={`min-h-11 w-full rounded-lg border bg-white px-4 outline-none focus:ring-2 focus:ring-brand/20 ${
          erro ? "border-danger" : "border-field"
        }`}
        placeholder={`Pesquise ${label.toLocaleLowerCase("pt-BR")} pelo nome`}
        value={busca}
        disabled={desabilitado}
        onFocus={() => definirAberto(true)}
        onBlur={() => definirAberto(false)}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") definirAberto(false);

          if (
            evento.key === "Enter" &&
            aberto &&
            resultados.length === 1
          ) {
            evento.preventDefault();
            escolher(resultados[0]);
          }
        }}
        onChange={(evento) => {
          definirBusca(evento.target.value);
          onChange("");
          definirAberto(true);
        }}
      />

      {erro && (
        <p
          role="alert"
          className="mt-1.5 text-xs font-semibold text-danger"
        >
          {erro}
        </p>
      )}

      {aberto && !desabilitado && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-field bg-white shadow-lg"
        >
          {resultados.map((opcao) => (
            <li key={opcao.id}>
              <button
                type="button"
                role="option"
                aria-selected={
                  String(opcao.id) === String(valor)
                }
                className="w-full px-4 py-2 text-left text-sm hover:bg-canvas focus:bg-canvas"
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => escolher(opcao)}
              >
                {opcao.nome}
              </button>
            </li>
          ))}

          {!resultados.length && (
            <li className="px-4 py-3 text-sm text-muted">
              Nenhum nome encontrado.
            </li>
          )}

          {opcoes.length > 30 && resultados.length === 30 && (
            <li className="px-4 py-2 text-xs text-muted">
              Refine a busca para ver mais resultados.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
