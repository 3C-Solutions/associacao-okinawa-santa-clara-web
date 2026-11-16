export const interpretarValorReembolso = (valor) => Math.round(Number(String(valor).replace(",", ".")) * 100) / 100;

export function validarReembolso(formulario) {
  const erros = {};
  const formatoValorValido = /^\d+(?:[.,]\d{1,2})?$/.test(String(formulario.amount).trim());
  const valor = interpretarValorReembolso(formulario.amount);
  if (formulario.reason.trim().length < 5) erros.reason = "Descreva o motivo do reembolso.";
  if (!formatoValorValido || !Number.isFinite(valor) || valor <= 0) erros.amount = "Informe um valor maior que zero e com até duas casas decimais.";
  if (!formulario.receipt) erros.receipt = "Anexe o comprovante.";
  return { erros, valor };
}
