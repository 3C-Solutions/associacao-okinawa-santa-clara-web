import { ehPapelFamiliar } from "@/lib/data.js";
import { familiaDe } from "@/lib/people.js";
import { usarArmazenamento } from "./StoreProvider.jsx";

// Dados e escopo da conta logada. "account" é a chave da conta em state.profiles; o tipo de perfil vem de profile.role.
export function usarUsuario(conta) {
  const { state: dadosAplicacao } = usarArmazenamento();
  const perfil = dadosAplicacao.profiles[conta];
  const papel = perfil.role || conta;
  const familia = ehPapelFamiliar(papel);
  const departamento = papel === "department" ? dadosAplicacao.departments.find((dataValor) => dataValor.id === perfil.departmentId) : null;
  const associado = familia ? dadosAplicacao.associates.find((elementoA) => elementoA.id === perfil.associateId) : null;
  // o dependente enxerga a família do associado responsável; "person" é o próprio dependente
  const pessoa = papel === "dependent" && associado ? associado.dependents.find((parametro) => parametro.id === perfil.personId) || null : null;
  const escopo = papel === "admin" ? "assoc" : papel === "department" ? `dept:${perfil.departmentId}` : `member:${perfil.associateId}`;
  return { profile: perfil, role: papel, department: departamento, associate: associado, person: pessoa, family: familiaDe(dadosAplicacao, associado), scope: escopo, ownerId: papel === "department" ? perfil.departmentId : familia ? perfil.associateId : "admin" };
}
