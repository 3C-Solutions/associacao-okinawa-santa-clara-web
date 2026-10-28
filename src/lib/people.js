// Funções auxiliares sobre famílias, associados, dependentes e inscrições em departamentos.
import { isFamilyRole } from "./data.js";

// ---------- famílias ----------
export const associateOfFamily = (state, familyId) => state.associates.find((a) => a.familyId === familyId);
export const familyOf = (state, associate) => (associate ? (state.families || []).find((f) => f.id === associate.familyId) || null : null);
export const familyLabel = (f) => (f ? `Família ${f.surname}` : "Sem família");
export const formatAddress = (f) => {
  if (!f) return "";
  const street = [f.address, f.number].filter(Boolean).join(", ");
  const first = [street, f.complement].filter(Boolean).join(" — ");
  return [first, f.district, [f.city, f.uf].filter(Boolean).join("/"), f.cep].filter(Boolean).join(" · ");
};

// destino de uma notificação: o departamento ou a família dona do dado
export const targetOf = (role, ownerId) => (role === "department" ? { departmentId: ownerId } : isFamilyRole(role) ? { associateId: ownerId } : {});

// e-mail já usado por alguma conta, associado ou dependente? (ignore = ids do próprio registro, em edição)
export const emailInUse = (state, email, ignore = []) => {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return false;
  const same = (value, id) => !ignore.includes(id) && String(value || "").trim().toLowerCase() === target;
  return (
    Object.entries(state.profiles).some(([key, p]) => same(p.email, key)) ||
    state.associates.some((a) => same(a.email, a.id) || a.dependents.some((d) => same(d.email, d.id)))
  );
};

export const peopleOf = (a) => [
  { id: a.id, name: a.name, relation: "Responsável", main: true, departmentIds: a.departmentIds },
  ...a.dependents.map((p) => ({ ...p, main: false })),
];

export const membersOf = (state, departmentId) =>
  state.associates.flatMap((a) => peopleOf(a).filter((p) => p.departmentIds.includes(departmentId)).map((p) => ({ ...p, associateId: a.id, associateName: a.name })));

export const countInDepartment = (state, departmentId) => membersOf(state, departmentId).length;

export const withEnrollment = (a, personId, departmentIds) =>
  personId === a.id ? { ...a, departmentIds } : { ...a, dependents: a.dependents.map((p) => (p.id === personId ? { ...p, departmentIds } : p)) };

// ---------- limite de vagas e solicitações de inscrição ----------
export const capacityOf = (department) => Number(department?.capacity) || 0; // 0 = sem limite definido
export const seatsLeft = (state, department) => (capacityOf(department) ? Math.max(0, capacityOf(department) - countInDepartment(state, department.id)) : Infinity);
export const isFull = (state, department) => seatsLeft(state, department) === 0;

export const allPeople = (state) =>
  state.associates.flatMap((a) => peopleOf(a).map((p) => ({ ...p, associateId: a.id, associateName: a.name })));

export const requestsOf = (state, departmentId, status) =>
  (state.enrollmentRequests || []).filter((r) => r.departmentId === departmentId && (!status || r.status === status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

// solicitação ainda aberta (pendente ou em lista de espera) de uma pessoa para um departamento
export const openRequest = (state, departmentId, personId) =>
  (state.enrollmentRequests || []).find((r) => r.departmentId === departmentId && r.personId === personId && (r.status === "Pendente" || r.status === "Lista de espera"));

export const enrollPerson = (a, personId, departmentId) => {
  const p = peopleOf(a).find((x) => x.id === personId);
  return p && !p.departmentIds.includes(departmentId) ? withEnrollment(a, personId, [...p.departmentIds, departmentId]) : a;
};
export const unenrollPerson = (a, personId, departmentId) => {
  const p = peopleOf(a).find((x) => x.id === personId);
  return p ? withEnrollment(a, personId, p.departmentIds.filter((d) => d !== departmentId)) : a;
};
