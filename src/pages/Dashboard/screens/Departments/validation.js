export function validarDepartamento(formulario, matriculado = 0) {
  const erros = {};
  const limite = Number(formulario.capacity);
  if (!Number.isInteger(limite) || limite < 1) erros.capacity = "Informe o limite de inscritos (mínimo 1).";
  else if (limite < matriculado) erros.capacity = `O departamento já tem ${matriculado} inscritos. Remova inscritos antes de reduzir o limite.`;
  if (formulario.name.trim().length < 2) erros.name = "Informe o nome do departamento.";
  if (formulario.description.trim().length < 10) erros.description = "Descreva o departamento (mínimo de 10 caracteres).";
  if (!formulario.teacher.trim()) erros.teacher = "Informe o responsável.";
  if (formulario.fee === "" || Number(formulario.fee) < 0 || Number.isNaN(Number(formulario.fee))) erros.fee = "Informe um valor válido.";
  return erros;
}
