import { useState } from "react";
import { Botao, Campo, CampoAreaTexto, Modal, CampoSelecao, CaixaSelecao } from "@/components/ui";
import { ESPACOS_EVENTO } from "@/services/eventosApi.js";

export default function FormularioReserva({ initialDate: dataInicial, today: hoje, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState({
    titulo: "", descricao: "", dtInicio: dataInicial, dtFim: dataInicial,
    diaInteiro: false, horaInicio: "19:00", horaFim: "21:00", codigoEspaco: "SALAO",
  });
  const [erros, definirErros] = useState({});
  const [enviando, definirEnviando] = useState(false);
  const definir = (chave) => (valor) => {
    definirFormulario((anterior) => ({ ...anterior, [chave]: valor }));
    definirErros((anterior) => ({ ...anterior, [chave]: undefined }));
  };
  const enviar = async () => {
    const novosErros = {};
    if ((formulario.titulo || "").trim().length < 3) novosErros.titulo = "Informe a finalidade da reserva.";
    if (!formulario.dtInicio || formulario.dtInicio < hoje) novosErros.dtInicio = "Escolha uma data a partir de hoje.";
    if (!formulario.dtFim || formulario.dtFim < formulario.dtInicio) novosErros.dtFim = "Confira a data final.";
    if (!formulario.codigoEspaco) novosErros.codigoEspaco = "Selecione um espaço.";
    if (!formulario.diaInteiro && (!formulario.horaInicio || !formulario.horaFim ||
      `${formulario.dtInicio}T${formulario.horaInicio}` >= `${formulario.dtFim}T${formulario.horaFim}`)) novosErros.horaFim = "O término deve ser posterior ao início.";
    definirErros(novosErros);
    if (Object.keys(novosErros).length) return;
    definirEnviando(true);
    try {
      await aoSalvar({ ...formulario, titulo: formulario.titulo.trim(),
        descricao: formulario.descricao?.trim() || null,
        horaInicio: formulario.diaInteiro ? null : formulario.horaInicio,
        horaFim: formulario.diaInteiro ? null : formulario.horaFim });
    } finally { definirEnviando(false); }
  };
  return (
    <Modal title="Solicitar reserva de espaço" onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao disabled={enviando} onClick={enviar}>Enviar solicitação</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelecao className="sm:col-span-2" label="Espaço para aluguel" value={formulario.codigoEspaco} onChange={definir("codigoEspaco")} options={ESPACOS_EVENTO} error={erros.codigoEspaco} required />
        <Campo label="Data de início" type="date" min={hoje} value={formulario.dtInicio} onChange={definir("dtInicio")} error={erros.dtInicio} required />
        <Campo label="Data de término" type="date" min={formulario.dtInicio} value={formulario.dtFim} onChange={definir("dtFim")} error={erros.dtFim} required />
        <div className="sm:col-span-2"><CaixaSelecao checked={formulario.diaInteiro} onChange={definir("diaInteiro")}>Reserva de dia inteiro (inclusive vários dias)</CaixaSelecao></div>
        {!formulario.diaInteiro && <><Campo label="Horário inicial" type="time" value={formulario.horaInicio} onChange={definir("horaInicio")} required /><Campo label="Horário final" type="time" value={formulario.horaFim} onChange={definir("horaFim")} error={erros.horaFim} required /></>}
        <Campo className="sm:col-span-2" label="Finalidade" value={formulario.titulo} onChange={definir("titulo")} error={erros.titulo} maxLength={100} required />
        <CampoAreaTexto className="sm:col-span-2" label="Detalhes do pedido (visíveis à Diretoria)" value={formulario.descricao} onChange={definir("descricao")} maxLength={500} rows={3} />
      </div>
      <p className="mt-4 text-xs text-muted">A solicitação permanece pendente até aprovação da Diretoria. Espaço completo reserva todos os ambientes.</p>
    </Modal>
  );
}