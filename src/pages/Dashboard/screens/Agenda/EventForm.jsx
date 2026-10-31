import { useState } from "react";
import { CATEGORIAS_EVENTOS } from "@/lib/data.js";
import { Botao, Campo, Modal, CampoSelecao } from "@/components/ui";

export default function FormularioEvento({ event: evento, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState(evento);
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviar = () => {
    const proximo = {};
    if (formulario.title.trim().length < 3) proximo.title = "Informe o nome do evento.";
    if (!formulario.date) proximo.date = "Informe a data.";
    if (!formulario.time) proximo.time = "Informe o horário.";
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar({ ...formulario, title: formulario.title.trim() });
  };
  return (
    <Modal title={evento.id ? "Editar evento" : "Novo evento"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>Salvar</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" label="Nome do evento" value={formulario.title} onChange={definir("title")} error={erros.title} required />
        <Campo label="Data" type="date" value={formulario.date} onChange={definir("date")} error={erros.date} required />
        <Campo label="Horário" type="time" value={formulario.time} onChange={definir("time")} error={erros.time} required />
        <CampoSelecao label="Categoria" value={formulario.category} onChange={definir("category")} options={CATEGORIAS_EVENTOS} />
        <Campo label="Responsável" value={formulario.owner} onChange={definir("owner")} />
      </div>
    </Modal>
  );
}
