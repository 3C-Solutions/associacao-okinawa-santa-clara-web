import { useState } from "react";
import { Botao, Campo, Modal } from "@/components/ui";

export default function FormularioReserva({ initialDate: dataInicial, today: hoje, hasConflict: temConflito, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState({ date: dataInicial, time: "19:00", title: "" });
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviar = () => {
    const proximo = {};
    if (!formulario.date || formulario.date < hoje) proximo.date = "Escolha uma data a partir de hoje.";
    else if (temConflito(formulario.date, formulario.time)) proximo.time = "Já existe um evento neste horário. Escolha outro.";
    if (!formulario.time) proximo.time = "Informe o horário.";
    if (formulario.title.trim().length < 3) proximo.title = "Descreva a finalidade da reserva.";
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar({ ...formulario, title: formulario.title.trim() });
  };
  return (
    <Modal title="Solicitar reserva do salão" onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>Enviar solicitação</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Data" type="date" min={hoje} value={formulario.date} onChange={definir("date")} error={erros.date} required />
        <Campo label="Horário" type="time" value={formulario.time} onChange={definir("time")} error={erros.time} required />
        <Campo className="sm:col-span-2" label="Finalidade" placeholder="Ex.: ensaio extra, aniversário…" value={formulario.title} onChange={definir("title")} error={erros.title} required />
      </div>
      <p className="mt-4 text-xs text-muted">A Diretoria analisa o pedido e você recebe uma notificação com a resposta.</p>
    </Modal>
  );
}
