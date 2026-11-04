export function validarDespesa(dados, entrada = false) {
  const erros = {};
  const descricao = dados.descricao.trim();
  if (descricao.length < 3 || descricao.length > 200) erros.descricao = "Use de 3 a 200 caracteres para a descrição.";
  if (!dados.categoria.trim() || dados.categoria.trim().length > 100) erros.categoria = "Informe uma categoria válida.";
  const texto = String(dados.valor).replace(",", ".");
  const valor = Number(texto);
  if (!/^\d+(\.\d{1,2})?$/.test(texto) || !Number.isFinite(valor) || valor < 0.01 || valor > 999999999999.99) erros.valor = "Informe um valor positivo com até duas casas decimais.";
  const data = /^\d{4}-\d{2}-\d{2}$/.test(dados.dtDepesa) ? new Date(`${dados.dtDepesa}T12:00:00Z`) : null;
  if (!data || Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== dados.dtDepesa) erros.dtDepesa = "Informe uma data válida.";
  if (!(entrada ? ["Recebido", "Pendente"] : ["Pago", "Pendente", "Recusado"]).includes(dados.status)) erros.status = "Selecione um status válido.";
  if (dados.fkFamilia !== "" && (!/^\d+$/.test(String(dados.fkFamilia)) || !Number.isSafeInteger(Number(dados.fkFamilia)) || Number(dados.fkFamilia) < 1 || Number(dados.fkFamilia) > 2147483647)) erros.fkFamilia = "Informe um código de família inteiro e positivo.";
  return erros;
}
