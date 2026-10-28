import { useState } from "react";
import { Button, Field, Modal } from "@/components/ui";

export default function PasswordModal({ current, onClose, onSave }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };
  const submit = () => {
    const next = {};
    if (form.current !== current) next.current = "Senha atual incorreta.";
    if (form.next.length < 8) next.next = "A nova senha deve ter no mínimo 8 caracteres.";
    else if (form.next === form.current) next.next = "A nova senha deve ser diferente da atual.";
    if (form.confirm !== form.next) next.confirm = "As senhas não conferem.";
    setErrors(next);
    if (!Object.keys(next).length) onSave(form.next);
  };
  return (
    <Modal size="sm" title="Alterar senha" onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Salvar senha</Button></>}>
      <div className="space-y-4">
        <Field label="Senha atual" type="password" value={form.current} onChange={set("current")} error={errors.current} />
        <Field label="Nova senha" type="password" value={form.next} onChange={set("next")} error={errors.next} hint="Mínimo de 8 caracteres." />
        <Field label="Confirmar nova senha" type="password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
      </div>
    </Modal>
  );
}
