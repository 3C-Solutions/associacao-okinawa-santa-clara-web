import { useRef, useState } from "react";
import { Botao, Campo, CampoSelecao, Modal } from "@/components/ui";
import { hojeISO } from "@/lib/data.js";
import { validarDespesa } from "./financeValidation.js";

const categorias = ["Infraestrutura", "Materiais", "Eventos", "Reembolsos", "Outros"];

export default function DespesasForm({ registro, onClose, onSave }) {
  const [dados, setDados] = useState({
    dtDepesa: registro.date || hojeISO(), descricao: registro.description || "",
    categoria: registro.category || "Outros", valor: registro.amount ?? "",
    status: registro.status || "Pendente", fkFamilia: registro.fkFamilia ?? "",
  });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const enviando = useRef(false);
  const fechar = () => { if (!enviando.current) onClose(); };
  const editar = (campo) => (valor) => {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
    setErro("");
  };
  const enviar = async (evento) => {
    evento?.preventDefault();
    if (enviando.current) return;
    const falhas = validarDespesa(dados);
    setErros(falhas);
    if (Object.keys(falhas).length) return;
    enviando.current = true;
    setSalvando(true);
    setErro("");
    try {
      await onSave({ ...dados, descricao: dados.descricao.trim(), categoria: dados.categoria.trim(),
        valor: Number(String(dados.valor).replace(",", ".")), fkFamilia: dados.fkFamilia === "" ? null : Number(dados.fkFamilia) });
    } catch (falha) {
      setErro(falha.message || "Não foi possível salvar a despesa. Tente novamente.");
    } finally {
      enviando.current = false;
      setSalvando(false);
    }
  };
  const opcoes = categorias.includes(dados.categoria) ? categorias : [dados.categoria, ...categorias];
  return <Modal title={registro.id ? "Editar despesa" : "Nova despesa"} onClose={fechar} footer={<><Botao variant="outline" disabled={salvando} onClick={fechar}>Cancelar</Botao><Botao disabled={salvando} onClick={enviar}>{salvando ? "Salvando..." : "Salvar despesa"}</Botao></>}>
    <form onSubmit={enviar} noValidate className="space-y-5" aria-busy={salvando}>
      <p className="text-sm leading-relaxed text-muted">Registre uma saída do caixa. Despesas pendentes só entram no saldo após a confirmação.</p>
      <fieldset disabled={salvando} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" label="Descrição" placeholder="Ex.: compra de materiais para o salão" value={dados.descricao} onChange={editar("descricao")} error={erros.descricao} maxLength={200} required />
        <CampoSelecao label="Categoria" value={dados.categoria} onChange={editar("categoria")} options={opcoes} error={erros.categoria} required />
        <CampoSelecao label="Status" value={dados.status} onChange={editar("status")} options={["Pendente", "Pago", ...(dados.status === "Recusado" ? ["Recusado"] : [])]} error={erros.status} required />
        <Campo label="Valor (R$)" type="number" min="0.01" max="999999999999.99" step="0.01" placeholder="0,00" value={dados.valor} onChange={editar("valor")} error={erros.valor} required />
        <Campo label="Data da despesa" type="date" value={dados.dtDepesa} onChange={editar("dtDepesa")} error={erros.dtDepesa} required />
        <Campo className="sm:col-span-2" label="Código da família (opcional)" type="number" min="1" step="1" value={dados.fkFamilia} onChange={editar("fkFamilia")} error={erros.fkFamilia} hint="Preencha somente se a despesa estiver vinculada a uma família cadastrada." />
      </fieldset>
      {erro && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{erro}</p>}
      <button type="submit" hidden disabled={salvando} tabIndex={-1} />
    </form>
  </Modal>;
}
