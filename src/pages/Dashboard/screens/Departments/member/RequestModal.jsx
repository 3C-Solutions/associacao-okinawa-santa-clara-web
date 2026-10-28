import { useState } from "react";
import { Button, Checkbox, Modal } from "@/components/ui";

export default function RequestModal({ department, people, full, onClose, onSave }) {
  const [ids, setIds] = useState([]);
  const toggle = (id, on) => setIds((list) => (on ? [...list, id] : list.filter((x) => x !== id)));
  return (
    <Modal size="sm" title={`Solicitar inscrição — ${department.name}`} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!ids.length} onClick={() => onSave(ids)}>{full ? "Entrar na lista de espera" : "Enviar solicitação"}</Button></>}>
      <p className="mb-4 text-sm text-muted">Selecione quem da família deseja participar. O departamento analisará a solicitação.{full ? " As vagas estão preenchidas, então a solicitação entrará na lista de espera." : ""}</p>
      <div className="space-y-2">{people.map((p) => <Checkbox key={p.id} checked={ids.includes(p.id)} onChange={(on) => toggle(p.id, on)}>{p.name} <span className="text-muted">· {p.relation}</span></Checkbox>)}</div>
    </Modal>
  );
}
