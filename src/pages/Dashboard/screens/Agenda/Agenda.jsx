import { useMemo, useRef, useState } from "react";
import { MONTHS, fmtDate, fromISO, isFamilyRole, todayISO } from "@/lib/data.js";
import { useStore, useUser } from "@/store";
import { Badge, Button, Card, DataTable, EmptyState, Icon, IconButton, StatusBadge } from "@/components/ui";
import Calendar from "@/pages/Dashboard/components/Calendar.jsx";
import EventForm from "./EventForm.jsx";
import RejectModal from "./RejectModal.jsx";
import ReservationForm from "./ReservationForm.jsx";
import { targetOf } from "@/lib/people.js";

const byDateTime = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

export default function Agenda({ role, account }) {
  const { state, save, remove, notify, toast, confirm } = useStore();
  const user = useUser(account);
  const today = todayISO();
  const admin = role === "admin";
  const [view, setView] = useState({ y: fromISO(today).getFullYear(), m: fromISO(today).getMonth() });
  const [selected, setSelected] = useState(today);
  const [eventForm, setEventForm] = useState(null);
  const [reservationForm, setReservationForm] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const requestsRef = useRef(null);

  const ownerName = role === "department" ? `Departamento ${user.department?.name}` : isFamilyRole(role) ? user.profile.name : "Diretoria";
  const myReservations = useMemo(() => state.reservations.filter((r) => admin || r.ownerId === user.ownerId).sort((a, b) => (a.status === "Pendente" ? -1 : 1) - (b.status === "Pendente" ? -1 : 1) || b.date.localeCompare(a.date)), [state.reservations, admin, user.ownerId]);
  const pending = myReservations.filter((r) => r.status === "Pendente");

  const marks = {};
  pending.forEach((r) => { marks[r.date] = "pending"; });
  state.events.forEach((e) => { marks[e.date] = "event"; });

  const monthPrefix = `${view.y}-${String(view.m + 1).padStart(2, "0")}`;
  const monthEvents = state.events.filter((e) => e.date.startsWith(monthPrefix)).sort(byDateTime);
  const dayEvents = state.events.filter((e) => e.date === selected).sort(byDateTime);
  const dayPending = pending.filter((r) => r.date === selected);

  const hasConflict = (date, time) => state.events.some((e) => e.date === date && e.time === time);

  const approve = (r) => {
    if (hasConflict(r.date, r.time)) { toast("Já existe um evento nesta data e horário.", "error"); return; }
    save("reservations", { ...r, status: "Aprovada", decidedAt: new Date().toISOString() });
    save("events", { date: r.date, time: r.time, title: r.title, category: "Comunidade", owner: r.ownerName, reservationId: r.id });
    notify(r.role, "Reserva aprovada", `Sua solicitação para ${fmtDate(r.date)} às ${r.time} foi autorizada pela Diretoria.`, "agenda", targetOf(r.role, r.ownerId));
    toast("Reserva aprovada e evento criado");
  };
  const reject = (r, reason) => {
    save("reservations", { ...r, status: "Recusada", reason, decidedAt: new Date().toISOString() });
    notify(r.role, "Reserva recusada", `Sua solicitação para ${fmtDate(r.date)} não foi autorizada${reason ? `: ${reason}` : "."}`, "agenda", targetOf(r.role, r.ownerId));
    toast("Reserva recusada");
    setRejecting(null);
  };
  const cancel = (r) => confirm({ title: "Cancelar solicitação", message: `Cancelar a solicitação “${r.title}”?`, confirmLabel: "Cancelar solicitação", onConfirm: () => { save("reservations", { ...r, status: "Cancelada" }); toast("Solicitação cancelada"); } });
  const removeEvent = (e) => confirm({ title: "Excluir evento", message: `Excluir o evento “${e.title}” de ${fmtDate(e.date)}?`, onConfirm: () => { remove("events", e.id); toast("Evento excluído"); } });

  const eventColumns = [
    { key: "date", label: "Data", render: (e) => fmtDate(e.date) },
    { key: "title", label: "Evento" },
    { key: "category", label: "Categoria", render: (e) => <Badge tone="info">{e.category}</Badge> },
    { key: "owner", label: "Responsável" },
    { key: "time", label: "Horário" },
  ];
  const reservationColumns = [
    { key: "date", label: "Data", render: (r) => `${fmtDate(r.date)} · ${r.time}` },
    { key: "title", label: "Finalidade", render: (r) => <span>{r.title}{r.reason && <span className="mt-1 block text-xs text-muted">Motivo: {r.reason}</span>}</span> },
    ...(admin ? [{ key: "ownerName", label: "Solicitante" }] : []),
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7"><Calendar marks={marks} selected={selected} onSelect={setSelected} view={view} onView={setView} /></div>
        <div className="flex flex-col gap-6 xl:col-span-5">
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="mb-1 text-lg font-bold">Ações da agenda</h2>
            {admin ? (
              <>
                <Button onClick={() => setEventForm({ date: selected, time: "19:00", title: "", category: "Cultural", owner: "Diretoria" })}><Icon name="plus" size={18} /> Novo evento</Button>
                <Button variant="secondary" onClick={() => requestsRef.current?.scrollIntoView({ behavior: "smooth" })}>Autorizar reservas {pending.length > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{pending.length}</span>}</Button>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted">Escolha uma data disponível e envie sua solicitação para análise da Diretoria.</p>
                <Button onClick={() => setReservationForm(true)}>Solicitar reserva</Button>
              </>
            )}
          </Card>
          <Card className="flex-1 p-6">
            <h2 className="text-lg font-bold">{fmtDate(selected)}</h2>
            {dayEvents.length === 0 && dayPending.length === 0 ? <p className="mt-3 text-sm text-muted">Nenhum evento neste dia.</p> : (
              <ul className="mt-3 divide-y divide-divider">
                {dayEvents.map((e) => <li key={e.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{e.title}</p><p className="mt-0.5 text-xs text-muted">{e.time} · {e.owner}</p></div><Badge tone="info">{e.category}</Badge></li>)}
                {dayPending.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{r.title}</p><p className="mt-0.5 text-xs text-muted">{r.time} · {r.ownerName}</p></div><StatusBadge status="Pendente" /></li>)}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Eventos de {MONTHS[view.m]} de {view.y}</h2>
        <DataTable
          columns={eventColumns}
          rows={monthEvents}
          empty={<EmptyState icon="calendar" title="Nenhum evento neste mês">{admin ? "Use “Novo evento” para cadastrar." : "Veja outros meses no calendário."}</EmptyState>}
          actions={admin ? (e) => (<><IconButton icon="edit" label="Editar" size="sm" onClick={() => setEventForm(e)} /><IconButton icon="trash" label="Excluir" tone="danger" size="sm" onClick={() => removeEvent(e)} /></>) : undefined}
        />
      </section>

      <section ref={requestsRef} className="scroll-mt-6">
        <h2 className="mb-3 text-lg font-bold">{admin ? "Solicitações de reserva" : "Minhas solicitações"}</h2>
        <DataTable
          columns={reservationColumns}
          rows={myReservations}
          empty={<EmptyState icon="clock" title="Nenhuma solicitação">{admin ? "Quando um departamento ou associado pedir uma data, ela aparece aqui." : "Use “Solicitar reserva” para pedir uma data."}</EmptyState>}
          actions={(r) => r.status !== "Pendente" ? null : admin ? (<><IconButton icon="check" label="Aprovar" size="sm" onClick={() => approve(r)} /><IconButton icon="close" label="Recusar" tone="danger" size="sm" onClick={() => setRejecting(r)} /></>) : (<IconButton icon="trash" label="Cancelar solicitação" tone="danger" size="sm" onClick={() => cancel(r)} />)}
        />
      </section>

      {eventForm && <EventForm event={eventForm} onClose={() => setEventForm(null)} onSave={(e) => { save("events", e); toast(e.id ? "Evento atualizado" : "Evento criado"); setEventForm(null); setSelected(e.date); setView({ y: fromISO(e.date).getFullYear(), m: fromISO(e.date).getMonth() }); }} />}
      {reservationForm && (
        <ReservationForm
          initialDate={selected >= today ? selected : today}
          today={today}
          hasConflict={hasConflict}
          onClose={() => setReservationForm(false)}
          onSave={(data) => {
            save("reservations", { ...data, requester: user.profile.name, role, ownerId: user.ownerId, ownerName, status: "Pendente", createdAt: new Date().toISOString() });
            notify("admin", "Nova solicitação de reserva", `${ownerName} solicitou ${fmtDate(data.date)} às ${data.time}.`, "agenda");
            toast("Solicitação enviada para a Diretoria");
            setReservationForm(false);
          }}
        />
      )}
      {rejecting && <RejectModal reservation={rejecting} onClose={() => setRejecting(null)} onConfirm={(reason) => reject(rejecting, reason)} />}
    </div>
  );
}
