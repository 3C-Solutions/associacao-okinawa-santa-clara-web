const CHAVE_REEMBOLSOS = "okinawa-sc-reembolsos-v1";
const EVENTO_REEMBOLSOS = "okinawa-sc-reembolsos-atualizados";

export function usuarioEhFinanceiro(nomeFuncao) {
  return String(nomeFuncao || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes("financeir");
}

export function reembolsosVisiveis(itens, usuarioId, podeRevisar) {
  return itens.filter((item) => podeRevisar || String(item.ownerId) === String(usuarioId));
}

export function lerReembolsos(storage = window.localStorage) {
  const salvo = storage.getItem(CHAVE_REEMBOLSOS);
  if (salvo === null) return [];
  let itens;
  try {
    itens = JSON.parse(salvo);
  } catch {
    throw new Error("Não foi possível ler a lista local de reembolsos. Os dados salvos estão inválidos.");
  }
  if (!Array.isArray(itens)) throw new Error("A lista local de reembolsos está em um formato inválido.");
  return itens;
}

export function atualizarReembolsos(transformar, storage = window.localStorage) {
  const itens = transformar(lerReembolsos(storage));
  if (!Array.isArray(itens)) throw new TypeError("A atualização dos reembolsos deve retornar uma lista.");
  storage.setItem(CHAVE_REEMBOLSOS, JSON.stringify(itens));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_REEMBOLSOS));
  return itens;
}

export function observarReembolsos(aoAtualizar) {
  const aoReceberEvento = (evento) => {
    if (evento.type === "storage" && evento.key !== CHAVE_REEMBOLSOS) return;
    aoAtualizar();
  };
  window.addEventListener("storage", aoReceberEvento);
  window.addEventListener(EVENTO_REEMBOLSOS, aoReceberEvento);
  return () => {
    window.removeEventListener("storage", aoReceberEvento);
    window.removeEventListener(EVENTO_REEMBOLSOS, aoReceberEvento);
  };
}
