import { useState } from "react";
import { Botao, Campo, CampoAreaTexto, Modal, CampoSelecao, CaixaSelecao } from "@/components/ui";
import { ESPACOS_EVENTO } from "@/services/eventosApi.js";

export default function FormularioEvento({ event: evento, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState({
    titulo: "", descricao: "", dtInicio: "", dtFim: "", diaInteiro: false,
    horaInicio: "09:00", horaFim: "10:00", codigoEspaco: "SALAO",
    tipoReservante: "DIRETORIA", fkFamilia: "", fkDepartamento: "", ...evento,
  });
  const [erros, definirErros] = useState({});
  const [salvando, definirSalvando] = useState(false);
  const definir = (chave) => (valor) => {
    definirFormulario((anterior) => ({ ...anterior, [chave]: valor }));
    definirErros((anterior) => ({ ...anterior, [chave]: undefined }));
  };
  const enviar = async () => {
    const errosValidacao = {};
    if ((formulario.titulo || "").trim().length < 3) errosValidacao.titulo = "Informe o nome do evento.";
    if (!formulario.dtInicio) errosValidacao.dtInicio = "Informe a data inicial.";
    if (!formulario.dtFim || formulario.dtFim < formulario.dtInicio) errosValidacao.dtFim = "A data final deve ser igual ou posterior à inicial.";
    if (!formulario.codigoEspaco) errosValidacao.codigoEspaco = "Selecione um espaço.";
    if (!formulario.diaInteiro && (!formulario.horaInicio || !formulario.horaFim ||
      `${formulario.dtInicio}T${formulario.horaInicio}` >= `${formulario.dtFim}T${formulario.horaFim}`)) {
      errosValidacao.horaFim = "O término deve ser posterior ao início.";
    }
    if (formulario.tipoReservante === "DEPARTAMENTO" && !Number(formulario.fkDepartamento)) errosValidacao.fkDepartamento = "Informe o ID do departamento.";
    if (formulario.tipoReservante === "FAMILIA" && !Number(formulario.fkFamilia)) errosValidacao.fkFamilia = "Informe o ID da família.";
    definirErros(errosValidacao);
    if (Object.keys(errosValidacao).length) return;
    definirSalvando(true);
    try {
      await aoSalvar({
        titulo: formulario.titulo.trim(), descricao: formulario.descricao?.trim() || null,
        dtInicio: formulario.dtInicio, dtFim: formulario.dtFim,
        diaInteiro: formulario.diaInteiro,
        horaInicio: formulario.diaInteiro ? null : formulario.horaInicio,
        horaFim: formulario.diaInteiro ? null : formulario.horaFim,
        codigoEspaco: formulario.codigoEspaco,
        fkDepartamento: formulario.tipoReservante === "DEPARTAMENTO" ? Number(formulario.fkDepartamento) : null,
        fkFamilia: formulario.tipoReservante === "FAMILIA" ? Number(formulario.fkFamilia) : null,
      });
    } finally { definirSalvando(false); }
  };
  return (
    <Modal title={evento.id ? "Editar evento" : "Novo evento"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao disabled={salvando} onClick={enviar}>Salvar evento</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" label="Nome do evento" value={formulario.titulo} onChange={definir("titulo")} error={erros.titulo} maxLength={100} required />
        <CampoSelecao className="sm:col-span-2" label="Espaço para aluguel" value={formulario.codigoEspaco} onChange={definir("codigoEspaco")} options={ESPACOS_EVENTO} error={erros.codigoEspaco} required />
        <Campo label="Data de início" type="date" value={formulario.dtInicio} onChange={definir("dtInicio")} error={erros.dtInicio} required />
        <Campo label="Data de término" type="date" value={formulario.dtFim} onChange={definir("dtFim")} error={erros.dtFim} required />
        <div className="sm:col-span-2"><CaixaSelecao checked={formulario.diaInteiro} onChange={definir("diaInteiro")}>Evento de dia inteiro (inclusive vários dias)</CaixaSelecao></div>
        {!formulario.diaInteiro && <><Campo label="Horário inicial" type="time" value={formulario.horaInicio || ""} onChange={definir("horaInicio")} required /><Campo label="Horário final" type="time" value={formulario.horaFim || ""} onChange={definir("horaFim")} error={erros.horaFim} required /></>}
        <CampoSelecao label="Reservado para" value={formulario.tipoReservante} onChange={definir("tipoReservante")} options={[{ value: "DIRETORIA", label: "Diretoria" }, { value: "DEPARTAMENTO", label: "Departamento" }, { value: "FAMILIA", label: "Família" }]} />
        {formulario.tipoReservante === "DEPARTAMENTO" && <Campo label="ID do departamento" type="number" min="1" value={formulario.fkDepartamento || ""} onChange={definir("fkDepartamento")} error={erros.fkDepartamento} required />}
        {formulario.tipoReservante === "FAMILIA" && <Campo label="ID da família" type="number" min="1" value={formulario.fkFamilia || ""} onChange={definir("fkFamilia")} error={erros.fkFamilia} required />}
        <CampoAreaTexto className="sm:col-span-2" label="Descrição (apenas Diretoria)" rows={3} value={formulario.descricao || ""} onChange={definir("descricao")} maxLength={500} />
      </div>
    </Modal>
  );
}