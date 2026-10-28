import { useState } from "react";
import { maskCep } from "@/lib/data.js";
import { Button, Field, Modal } from "@/components/ui";

export default function FamilyForm({ family, onClose, onSave }) {
  const [form, setForm] = useState(family);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => {
    const next = key === "cep" ? maskCep(value) : key === "uf" ? value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) : value;
    setForm((f) => ({ ...f, [key]: next }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = () => {
    const next = {};
    if (form.surname.trim().length < 2) next.surname = "Informe o sobrenome da família.";
    if (form.address.trim().length < 3) next.address = "Informe o endereço.";
    if (form.uf && form.uf.length !== 2) next.uf = "Use a sigla com 2 letras.";
    if (form.cep && form.cep.replace(/\D/g, "").length !== 8) next.cep = "O CEP deve ter 8 dígitos.";
    setErrors(next);
    if (!Object.keys(next).length) onSave({ ...form, surname: form.surname.trim(), address: form.address.trim() });
  };

  return (
    <Modal title={family.id ? "Editar família" : "Nova família"} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Salvar</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Sobrenome da família" value={form.surname} onChange={set("surname")} error={errors.surname} placeholder="Ex.: Takara" required />
        <Field className="sm:col-span-2" label="Endereço" value={form.address} onChange={set("address")} error={errors.address} placeholder="Rua, avenida…" required />
        <Field label="Número" value={form.number} onChange={set("number")} />
        <Field label="Complemento" value={form.complement} onChange={set("complement")} />
        <Field label="Bairro" value={form.district} onChange={set("district")} />
        <Field label="Cidade" value={form.city} onChange={set("city")} />
        <Field label="UF" value={form.uf} onChange={set("uf")} error={errors.uf} placeholder="SP" />
        <Field label="CEP" value={form.cep} onChange={set("cep")} error={errors.cep} placeholder="00000-000" />
      </div>
      <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">Depois de cadastrar a família, cadastre o associado responsável em Usuários e selecione esta família.</p>
    </Modal>
  );
}
