import { useState } from "react";
import { DIAS_SEMANA } from "@/lib/data.js";
import { Botao, Campo, Modal, CampoSelecao, CampoAreaTexto, Alternador } from "@/components/ui";
import SeletorImagem from "@/pages/Dashboard/components/ImagePicker.jsx";
import { validarDepartamento } from "../validation.js";

export default function FormularioDepartamento({ department: departamento, enrolled: matriculado = 0, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState(departamento);
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviar = () => {
    const proximo = validarDepartamento(formulario, matriculado);
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar({ ...formulario, name: formulario.name.trim(), description: formulario.description.trim(), teacher: formulario.teacher.trim() });
  };
  return (
    <Modal size="lg" title={departamento.id ? "Editar departamento" : "Novo departamento"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>Salvar</Botao></>}>
      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo className="sm:col-span-2" label="Nome do departamento" value={formulario.name} onChange={definir("name")} error={erros.name} required />
          <CampoAreaTexto className="sm:col-span-2" label="Descrição" rows={3} value={formulario.description} onChange={definir("description")} error={erros.description} required />
          <CampoSelecao label="Dia da semana" value={formulario.day} onChange={definir("day")} options={DIAS_SEMANA} />
          <Campo label="Horário" type="time" value={formulario.time} onChange={definir("time")} />
          <Campo label="Professor / responsável" value={formulario.teacher} onChange={definir("teacher")} error={erros.teacher} required />
          <Campo label="Mensalidade (R$)" type="number" min="0" step="0.01" value={formulario.fee} onChange={definir("fee")} error={erros.fee} />
          <Campo label="Limite de inscritos" type="number" min="1" step="1" value={formulario.capacity} onChange={definir("capacity")} error={erros.capacity} hint={matriculado ? `${matriculado} inscritos no momento.` : undefined} required />
          <div className="flex items-center gap-3 sm:col-span-2"><Alternador checked={formulario.active} onChange={definir("active")} label="Departamento ativo" /><span className="text-sm font-semibold">Departamento ativo (aparece no site)</span></div>
        </div>
        <SeletorImagem value={formulario.image} onChange={definir("image")} />
      </div>
    </Modal>
  );
}
