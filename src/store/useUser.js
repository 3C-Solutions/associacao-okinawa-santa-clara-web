import { isFamilyRole } from "@/lib/data.js";
import { familyOf } from "@/lib/people.js";
import { useStore } from "./StoreProvider.jsx";

// Dados e escopo da conta logada. "account" é a chave da conta em state.profiles; o tipo de perfil vem de profile.role.
export function useUser(account) {
  const { state } = useStore();
  const profile = state.profiles[account];
  const role = profile.role || account;
  const family = isFamilyRole(role);
  const department = role === "department" ? state.departments.find((d) => d.id === profile.departmentId) : null;
  const associate = family ? state.associates.find((a) => a.id === profile.associateId) : null;
  // o dependente enxerga a família do associado responsável; "person" é o próprio dependente
  const person = role === "dependent" && associate ? associate.dependents.find((p) => p.id === profile.personId) || null : null;
  const scope = role === "admin" ? "assoc" : role === "department" ? `dept:${profile.departmentId}` : `member:${profile.associateId}`;
  return { profile, role, department, associate, person, family: familyOf(state, associate), scope, ownerId: role === "department" ? profile.departmentId : family ? profile.associateId : "admin" };
}
