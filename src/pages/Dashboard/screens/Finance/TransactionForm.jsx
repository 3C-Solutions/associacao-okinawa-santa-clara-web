import { useState } from "react";
import { CATEGORIAS_FINANCEIRAS } from "@/lib/data.js";
import { Botao, Campo, Modal, CampoSelecao } from "@/components/ui";

export default function FormularioTransacao({ tx: transacao, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState({ ...transacao, amount: transacao.amount === "" ? "" : String(transacao.amount) });
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviar = () => {
    const proximo = {};
    if (formulario.description.trim().length < 3) proximo.description = "Descreva o lançamento.";
    const valor = Number(String(formulario.amount).replace(",", "."));
    if (!valor || valor <= 0) proximo.amount = "Informe um valor maior que zero.";
    if (!formulario.date) proximo.date = "Informe a data.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    aoSalvar({ ...formulario, description: formulario.description.trim(), amount: Math.round(valor * 100) / 100 });
  };
  return (
    <Modal title={transacao.id ? "Editar lançamento" : "Novo lançamento"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>Salvar</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" label="Descrição" value={formulario.description} onChange={definir("description")} error={erros.description} required />
        <CampoSelecao label="Tipo" value={formulario.type} onChange={definir("type")} options={[{ value: "in", label: "Entrada" }, { value: "out", label: "Saída" }]} />
        <CampoSelecao label="Categoria" value={formulario.category} onChange={definir("category")} options={CATEGORIAS_FINANCEIRAS} />
        <Campo label="Valor (R$)" type="number" min="0" step="0.01" value={formulario.amount} onChange={definir("amount")} error={erros.amount} required />
        <Campo label="Data" type="date" value={formulario.date} onChange={definir("date")} error={erros.date} required />
        <CampoSelecao className="sm:col-span-2" label="Status" value={formulario.status} onChange={definir("status")} options={["Pago", "Pendente"]} />
      </div>
    </Modal>
  );
}
