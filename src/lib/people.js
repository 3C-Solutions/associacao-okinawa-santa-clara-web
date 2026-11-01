// Funções auxiliares sobre famílias, associados, dependentes e inscrições em departamentos.
import { ehPapelFamiliar, formatarData } from "./data.js";

// A data de criação vem do cadastro, sem usar a antiga data de associação (since).
export const formatarDataCadastro = (pessoa) => {
  const valor = pessoa?.dataCriacao || pessoa?.createdAt;
  if (typeof valor !== "string") return "Não informada";
  const data = valor.split(/[T ]/)[0];
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? formatarData(data) : "Não informada";
};

// ---------- famílias ----------
export const associadoDaFamilia = (dadosAplicacao, identificadorFamilia) => dadosAplicacao.associates.find((elementoA) => elementoA.familyId === identificadorFamilia);
export const familiaDe = (dadosAplicacao, associado) => (associado ? (dadosAplicacao.families || []).find((elementoF) => elementoF.id === associado.familyId) || null : null);
export const rotuloFamilia = (elementoF) => (elementoF ? `Família ${elementoF.surname}` : "Sem família");
export const formatarEndereco = (elementoF) => {
  if (!elementoF) return "";
  const logradouro = [elementoF.address, elementoF.number].filter(Boolean).join(", ");
  const primeiro = [logradouro, elementoF.complement].filter(Boolean).join(" — ");
  return [primeiro, elementoF.district, [elementoF.city, elementoF.uf].filter(Boolean).join("/"), elementoF.cep].filter(Boolean).join(" · ");
};

// destino de uma notificação: o departamento ou a família dona do dado
export const alvoDe = (papel, identificadorResponsavel) => (papel === "department" ? { departmentId: identificadorResponsavel } : ehPapelFamiliar(papel) ? { associateId: identificadorResponsavel } : {});

// e-mail já usado por alguma conta, associado ou dependente? (ignore = ids do próprio registro, em edição)
export const emailEmUso = (dadosAplicacao, email, ignorar = []) => {
  const alvo = String(email || "").trim().toLowerCase();
  if (!alvo) return false;
  const igual = (valor, identificador) => !ignorar.includes(identificador) && String(valor || "").trim().toLowerCase() === alvo;
  return (
    Object.entries(dadosAplicacao.profiles).some(([chave, parametro]) => igual(parametro.email, chave)) ||
    dadosAplicacao.associates.some((elementoA) => igual(elementoA.email, elementoA.id) || elementoA.dependents.some((dataValor) => igual(dataValor.email, dataValor.id)))
  );
};

export const pessoasDe = (elementoA) => [
  { id: elementoA.id, name: elementoA.name, relation: "Responsável", main: true, departmentIds: elementoA.departmentIds },
  ...elementoA.dependents.map((parametro) => ({ ...parametro, main: false })),
];

export const membrosDe = (dadosAplicacao, departmentId) =>
  dadosAplicacao.associates.flatMap((elementoA) => pessoasDe(elementoA).filter((parametro) => parametro.departmentIds.includes(departmentId)).map((parametro) => ({ ...parametro, associateId: elementoA.id, associateName: elementoA.name })));

export const quantidadeNoDepartamento = (dadosAplicacao, departmentId) => membrosDe(dadosAplicacao, departmentId).length;

export const comMatricula = (elementoA, identificadorPessoa, departmentIds) =>
  identificadorPessoa === elementoA.id ? { ...elementoA, departmentIds: departmentIds } : { ...elementoA, dependents: elementoA.dependents.map((parametro) => (parametro.id === identificadorPessoa ? { ...parametro, departmentIds: departmentIds } : parametro)) };

// ---------- limite de vagas e solicitações de inscrição ----------
export const capacidadeDe = (departamento) => Number(departamento?.capacity) || 0; // 0 = sem limite definido
export const vagasRestantes = (dadosAplicacao, departamento) => (capacidadeDe(departamento) ? Math.max(0, capacidadeDe(departamento) - quantidadeNoDepartamento(dadosAplicacao, departamento.id)) : Infinity);
export const estaCompleto = (dadosAplicacao, departamento) => vagasRestantes(dadosAplicacao, departamento) === 0;

export const todasPessoas = (dadosAplicacao) =>
  dadosAplicacao.associates.flatMap((elementoA) => pessoasDe(elementoA).map((parametro) => ({ ...parametro, associateId: elementoA.id, associateName: elementoA.name })));

export const solicitacoesDe = (dadosAplicacao, departmentId, situacao) =>
  (dadosAplicacao.enrollmentRequests || []).filter((resultado) => resultado.departmentId === departmentId && (!situacao || resultado.status === situacao)).sort((elementoA, elementoB) => elementoA.createdAt.localeCompare(elementoB.createdAt));

// solicitação ainda aberta (pendente ou em lista de espera) de uma pessoa para um departamento
export const abrirSolicitacao = (dadosAplicacao, departmentId, identificadorPessoa) =>
  (dadosAplicacao.enrollmentRequests || []).find((resultado) => resultado.departmentId === departmentId && resultado.personId === identificadorPessoa && (resultado.status === "Pendente" || resultado.status === "Lista de espera"));

export const matricularPessoa = (elementoA, identificadorPessoa, departmentId) => {
  const parametro = pessoasDe(elementoA).find((valorX) => valorX.id === identificadorPessoa);
  return parametro && !parametro.departmentIds.includes(departmentId) ? comMatricula(elementoA, identificadorPessoa, [...parametro.departmentIds, departmentId]) : elementoA;
};
export const desmatricularPessoa = (elementoA, identificadorPessoa, departmentId) => {
  const parametro = pessoasDe(elementoA).find((valorX) => valorX.id === identificadorPessoa);
  return parametro ? comMatricula(elementoA, identificadorPessoa, parametro.departmentIds.filter((dataValor) => dataValor !== departmentId)) : elementoA;
};
