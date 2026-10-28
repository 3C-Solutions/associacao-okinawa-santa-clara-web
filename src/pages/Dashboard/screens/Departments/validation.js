export function validateDepartment(form, enrolled = 0) {
  const errors = {};
  const cap = Number(form.capacity);
  if (!Number.isInteger(cap) || cap < 1) errors.capacity = "Informe o limite de inscritos (mínimo 1).";
  else if (cap < enrolled) errors.capacity = `O departamento já tem ${enrolled} inscritos. Remova inscritos antes de reduzir o limite.`;
  if (form.name.trim().length < 2) errors.name = "Informe o nome do departamento.";
  if (form.description.trim().length < 10) errors.description = "Descreva o departamento (mínimo de 10 caracteres).";
  if (!form.teacher.trim()) errors.teacher = "Informe o responsável.";
  if (form.fee === "" || Number(form.fee) < 0 || Number.isNaN(Number(form.fee))) errors.fee = "Informe um valor válido.";
  return errors;
}
