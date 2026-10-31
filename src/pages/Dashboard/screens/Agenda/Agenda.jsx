import { useMemo, useRef, useState } from "react";
import { MESES, formatarData, deISO, ehPapelFamiliar, hojeISO } from "@/lib/data.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Selo, Botao, Cartao, TabelaDados, EstadoVazio, Icone, BotaoIcone, SeloStatus } from "@/components/ui";
import Calendario from "@/pages/Dashboard/components/Calendar.jsx";
import FormularioEvento from "./EventForm.jsx";
import ModalRejeicao from "./RejectModal.jsx";
import FormularioReserva from "./ReservationForm.jsx";
import { alvoDe } from "@/lib/people.js";

const porDataHora = (elementoA, elementoB) => (elementoA.date + elementoA.time).localeCompare(elementoB.date + elementoB.time);

export default function Agenda({ role: papel, account: conta }) {
  const { state: dadosAplicacao, save: salvar, remove: remover, notify: notificar, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const hoje = hojeISO();
  const administrador = papel === "admin";
  const [visualizacao, definirVisualizacao] = useState({ y: deISO(hoje).getFullYear(), m: deISO(hoje).getMonth() });
  const [selecionado, definirSelecionado] = useState(hoje);
  const [formularioEvento, definirFormularioEvento] = useState(null);
  const [formularioReserva, definirFormularioReserva] = useState(false);
  const [rejeitando, definirRejeitando] = useState(null);
  const referenciaSolicitacoes = useRef(null);

  const nomeResponsavel = papel === "department" ? `Departamento ${usuario.department?.name}` : ehPapelFamiliar(papel) ? usuario.profile.name : "Diretoria";
  const minhasReservas = useMemo(() => dadosAplicacao.reservations.filter((resultado) => administrador || resultado.ownerId === usuario.ownerId).sort((elementoA, elementoB) => (elementoA.status === "Pendente" ? -1 : 1) - (elementoB.status === "Pendente" ? -1 : 1) || elementoB.date.localeCompare(elementoA.date)), [dadosAplicacao.reservations, administrador, usuario.ownerId]);
  const pendente = minhasReservas.filter((resultado) => resultado.status === "Pendente");

  const marcacoes = {};
  pendente.forEach((resultado) => { marcacoes[resultado.date] = "pending"; });
  dadosAplicacao.events.forEach((evento) => { marcacoes[evento.date] = "event"; });

  const prefixoMes = `${visualizacao.y}-${String(visualizacao.m + 1).padStart(2, "0")}`;
  const eventosMensais = dadosAplicacao.events.filter((evento) => evento.date.startsWith(prefixoMes)).sort(porDataHora);
  const eventosDoDia = dadosAplicacao.events.filter((evento) => evento.date === selecionado).sort(porDataHora);
  const pendenciasDoDia = pendente.filter((resultado) => resultado.date === selecionado);

  const temConflito = (data, horario) => dadosAplicacao.events.some((evento) => evento.date === data && evento.time === horario);

  const aprovar = (resultado) => {
    if (temConflito(resultado.date, resultado.time)) { aviso("Já existe um evento nesta data e horário.", "error"); return; }
    salvar("reservations", { ...resultado, status: "Aprovada", decidedAt: new Date().toISOString() });
    salvar("events", { date: resultado.date, time: resultado.time, title: resultado.title, category: "Comunidade", owner: resultado.ownerName, reservationId: resultado.id });
    notificar(resultado.role, "Reserva aprovada", `Sua solicitação para ${formatarData(resultado.date)} às ${resultado.time} foi autorizada pela Diretoria.`, "agenda", alvoDe(resultado.role, resultado.ownerId));
    aviso("Reserva aprovada e evento criado");
  };
  const rejeitar = (resultado, motivo) => {
    salvar("reservations", { ...resultado, status: "Recusada", reason: motivo, decidedAt: new Date().toISOString() });
    notificar(resultado.role, "Reserva recusada", `Sua solicitação para ${formatarData(resultado.date)} não foi autorizada${motivo ? `: ${motivo}` : "."}`, "agenda", alvoDe(resultado.role, resultado.ownerId));
    aviso("Reserva recusada");
    definirRejeitando(null);
  };
  const cancelar = (resultado) => confirmar({ title: "Cancelar solicitação", message: `Cancelar a solicitação “${resultado.title}”?`, confirmLabel: "Cancelar solicitação", onConfirm: () => { salvar("reservations", { ...resultado, status: "Cancelada" }); aviso("Solicitação cancelada"); } });
  const removerEvento = (evento) => confirmar({ title: "Excluir evento", message: `Excluir o evento “${evento.title}” de ${formatarData(evento.date)}?`, onConfirm: () => { remover("events", evento.id); aviso("Evento excluído"); } });

  const colunasEventos = [
    { key: "date", label: "Data", render: (evento) => formatarData(evento.date) },
    { key: "title", label: "Evento" },
    { key: "category", label: "Categoria", render: (evento) => <Selo tone="info">{evento.category}</Selo> },
    { key: "owner", label: "Responsável" },
    { key: "time", label: "Horário" },
  ];
  const colunasReservas = [
    { key: "date", label: "Data", render: (resultado) => `${formatarData(resultado.date)} · ${resultado.time}` },
    { key: "title", label: "Finalidade", render: (resultado) => <span>{resultado.title}{resultado.reason && <span className="mt-1 block text-xs text-muted">Motivo: {resultado.reason}</span>}</span> },
    ...(administrador ? [{ key: "ownerName", label: "Solicitante" }] : []),
    { key: "status", label: "Status", render: (resultado) => <SeloStatus status={resultado.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7"><Calendario marks={marcacoes} selected={selecionado} onSelect={definirSelecionado} view={visualizacao} onView={definirVisualizacao} /></div>
        <div className="flex flex-col gap-6 xl:col-span-5">
          <Cartao className="flex flex-col gap-3 p-6">
            <h2 className="mb-1 text-lg font-bold">Ações da agenda</h2>
            {administrador ? (
              <>
                <Botao onClick={() => definirFormularioEvento({ date: selecionado, time: "19:00", title: "", category: "Cultural", owner: "Diretoria" })}><Icone name="plus" size={18} /> Novo evento</Botao>
                <Botao variant="secondary" onClick={() => referenciaSolicitacoes.current?.scrollIntoView({ behavior: "smooth" })}>Autorizar reservas {pendente.length > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{pendente.length}</span>}</Botao>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted">Escolha uma data disponível e envie sua solicitação para análise da Diretoria.</p>
                <Botao onClick={() => definirFormularioReserva(true)}>Solicitar reserva</Botao>
              </>
            )}
          </Cartao>
          <Cartao className="flex-1 p-6">
            <h2 className="text-lg font-bold">{formatarData(selecionado)}</h2>
            {eventosDoDia.length === 0 && pendenciasDoDia.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhum evento neste dia.</p> : (
              <ul className="mt-3 divide-y divide-divider">
                {eventosDoDia.map((evento) => <li key={evento.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{evento.title}</p><p className="mt-0.5 text-xs text-muted">{evento.time} · {evento.owner}</p></div><Selo tone="info">{evento.category}</Selo></li>)}
                {pendenciasDoDia.map((resultado) => <li key={resultado.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{resultado.title}</p><p className="mt-0.5 text-xs text-muted">{resultado.time} · {resultado.ownerName}</p></div><SeloStatus status="Pendente" /></li>)}
              </ul>
            )}
          </Cartao>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Eventos de {MESES[visualizacao.m]} de {visualizacao.y}</h2>
        <TabelaDados
          columns={colunasEventos}
          rows={eventosMensais}
          empty={<EstadoVazio icon="calendar" title="Nenhum evento neste mês">{administrador ? "Use “Novo evento” para cadastrar." : "Veja outros meses no calendário."}</EstadoVazio>}
          actions={administrador ? (evento) => (<><BotaoIcone icon="edit" label="Editar" size="sm" onClick={() => definirFormularioEvento(evento)} /><BotaoIcone icon="trash" label="Excluir" tone="danger" size="sm" onClick={() => removerEvento(evento)} /></>) : undefined}
        />
      </section>

      <section ref={referenciaSolicitacoes} className="scroll-mt-6">
        <h2 className="mb-3 text-lg font-bold">{administrador ? "Solicitações de reserva" : "Minhas solicitações"}</h2>
        <TabelaDados
          columns={colunasReservas}
          rows={minhasReservas}
          empty={<EstadoVazio icon="clock" title="Nenhuma solicitação">{administrador ? "Quando um departamento ou associado pedir uma data, ela aparece aqui." : "Use “Solicitar reserva” para pedir uma data."}</EstadoVazio>}
          actions={(resultado) => resultado.status !== "Pendente" ? null : administrador ? (<><BotaoIcone icon="check" label="Aprovar" size="sm" onClick={() => aprovar(resultado)} /><BotaoIcone icon="close" label="Recusar" tone="danger" size="sm" onClick={() => definirRejeitando(resultado)} /></>) : (<BotaoIcone icon="trash" label="Cancelar solicitação" tone="danger" size="sm" onClick={() => cancelar(resultado)} />)}
        />
      </section>

      {formularioEvento && <FormularioEvento event={formularioEvento} onClose={() => definirFormularioEvento(null)} onSave={(evento) => { salvar("events", evento); aviso(evento.id ? "Evento atualizado" : "Evento criado"); definirFormularioEvento(null); definirSelecionado(evento.date); definirVisualizacao({ y: deISO(evento.date).getFullYear(), m: deISO(evento.date).getMonth() }); }} />}
      {formularioReserva && (
        <FormularioReserva
          initialDate={selecionado >= hoje ? selecionado : hoje}
          today={hoje}
          hasConflict={temConflito}
          onClose={() => definirFormularioReserva(false)}
          onSave={(dados) => {
            salvar("reservations", { ...dados, requester: usuario.profile.name, role: papel, ownerId: usuario.ownerId, ownerName: nomeResponsavel, status: "Pendente", createdAt: new Date().toISOString() });
            notificar("admin", "Nova solicitação de reserva", `${nomeResponsavel} solicitou ${formatarData(dados.date)} às ${dados.time}.`, "agenda");
            aviso("Solicitação enviada para a Diretoria");
            definirFormularioReserva(false);
          }}
        />
      )}
      {rejeitando && <ModalRejeicao reservation={rejeitando} onClose={() => definirRejeitando(null)} onConfirm={(motivo) => rejeitar(rejeitando, motivo)} />}
    </div>
  );
}
