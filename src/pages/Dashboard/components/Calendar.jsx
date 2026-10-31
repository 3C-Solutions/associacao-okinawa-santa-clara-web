import { MESES, deISO, hojeISO } from "@/lib/data.js";
import { Cartao, Icone } from "@/components/ui";

const preencher = (quantidadeN) => String(quantidadeN).padStart(2, "0");

// marks: { "YYYY-MM-DD": "event" | "pending" }; view: { y, m } (m = 0..11)
export default function Calendario({ marks: marcacoes = {}, selected: selecionado, onSelect: aoSelecionar, view: visualizacao, onView: aoVisualizar, className: nomeClasse = "" }) {
  const hoje = hojeISO();
  const primeiro = new Date(visualizacao.y, visualizacao.m, 1).getDay();
  const diasNoMes = new Date(visualizacao.y, visualizacao.m + 1, 0).getDate();
  const celulas = Array.from({ length: Math.ceil((primeiro + diasNoMes) / 7) * 7 }, (ignorado, indice) => {
    const dia = indice - primeiro + 1;
    return dia >= 1 && dia <= diasNoMes ? dia : null;
  });
  const deslocamento = (variacao) => {
    const dataValor = new Date(visualizacao.y, visualizacao.m + variacao, 1);
    aoVisualizar({ y: dataValor.getFullYear(), m: dataValor.getMonth() });
  };
  const estaAtual = visualizacao.y === deISO(hoje).getFullYear() && visualizacao.m === deISO(hoje).getMonth();

  return (
    <Cartao className={`p-5 ${nomeClasse}`}>
      <div className="mb-5 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => deslocamento(-1)} className="grid size-9 rotate-180 place-items-center rounded-full text-brand hover:bg-brand-soft"><Icone name="arrow" /></button>
        <div className="text-center">
          <h2 className="font-bold">{MESES[visualizacao.m]} {visualizacao.y}</h2>
          {!estaAtual && <button type="button" onClick={() => aoVisualizar({ y: deISO(hoje).getFullYear(), m: deISO(hoje).getMonth() })} className="text-xs font-semibold text-brand hover:underline">Ir para hoje</button>}
        </div>
        <button type="button" aria-label="Próximo mês" onClick={() => deslocamento(1)} className="grid size-9 place-items-center rounded-full text-brand hover:bg-brand-soft"><Icone name="arrow" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((dataValor, indice) => <span key={indice} className="py-2 text-xs font-bold text-brand">{dataValor}</span>)}
        {celulas.map((dia, indice) => {
          if (!dia) return <span key={indice} />;
          const iso = `${visualizacao.y}-${preencher(visualizacao.m + 1)}-${preencher(dia)}`;
          const marcar = marcacoes[iso];
          const estaSelecionado = selecionado === iso;
          const ehHoje = iso === hoje;
          return (
            <button
              key={indice}
              type="button"
              onClick={() => aoSelecionar?.(iso)}
              aria-label={`${dia} de ${MESES[visualizacao.m]}${marcar ? (marcar === "pending" ? ", reserva pendente" : ", com evento") : ""}`}
              aria-pressed={estaSelecionado}
              className={`relative h-11 rounded-lg text-sm sm:h-12 transition ${estaSelecionado ? "bg-brand font-bold text-white" : ehHoje ? "bg-accent/60 font-bold text-brand hover:bg-accent" : marcar ? "font-bold text-brand hover:bg-brand-soft" : "hover:bg-brand-soft"}`}
            >
              {dia}
              {marcar && <span className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${marcar === "pending" ? "border border-brand bg-white" : estaSelecionado ? "bg-accent" : "bg-brand"}`} />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand" />Evento</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-brand bg-white" />Reserva pendente</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" />Hoje</span>
      </div>
    </Cartao>
  );
}
