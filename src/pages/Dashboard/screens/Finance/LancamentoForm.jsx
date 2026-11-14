import { useState } from "react";
import { Botao, Campo, CampoSelecao, Modal } from "@/components/ui";
import { hojeISO } from "@/lib/data.js";
const categoriasEntrada = ["Doações", "Aluguel do salão", "Mensalidades", "Anuidades", "Eventos", "Outros"];
const categoriasSaida = ["Materiais", "Infraestrutura", "Eventos", "Reembolsos", "Outros"];
export default function LancamentoForm({ registro, onClose, onSave }) {
const [dados, setDados] = useState({
descricao: registro?.description || "",
tipo_lancamento: registro?.type === "in" ? "ENTRADA" : "SAIDA",
categoria: registro?.category || "Outros",
valor: registro?.amount ?? "",
dt_lancamento: registro?.date || hojeISO(),
status: registro?.status === "Pago" ? "Pago" : "Pendente",
fk_familia: registro?.fk_familia ?? null,
});
const [salvando, setSalvando] = useState(false);
const [erro, setErro] = useState("");
const mudar = (campo) => (valor) => setDados((a) => ({ ...a, [campo]: valor }));
const enviar = async (evento) => {
evento?.preventDefault();
if (salvando) return;
if (!dados.descricao.trim() || !dados.dt_lancamento || !dados.categoria || Number(String(dados.valor).replace(",", ".")) <= 0)
{
setErro("Preencha a descrição, categoria, data e um valor maior que zero."); return;
}
setSalvando(true); setErro("");
try {
await onSave({ ...dados, descricao: dados.descricao.trim(),
valor: Number(String(dados.valor).replace(",", ".")) });
} catch (falha) { setErro(falha.message); }
finally { setSalvando(false); }
};
const opcoes = dados.tipo_lancamento === "ENTRADA" ? categoriasEntrada : categoriasSaida;
return <Modal title={registro?.id ? "Editar lançamento" : "Novo lançamento"} onClose={onClose}
footer={<><Botao variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Botao>
<Botao onClick={enviar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Botao></>}>
<form onSubmit={enviar} className="space-y-5">
<Campo label="Descrição" value={dados.descricao} onChange={mudar("descricao")} maxLength={200} required />
<div className="grid gap-4 sm:grid-cols-2">
<CampoSelecao label="Tipo" value={dados.tipo_lancamento} onChange={(valor) =>
setDados((a) => ({ ...a, tipo_lancamento: valor, categoria: "Outros" }))}
options={[{ value: "SAIDA", label: "Saída" }, { value: "ENTRADA", label: "Entrada" }]} />
<CampoSelecao label="Categoria" value={dados.categoria} onChange={mudar("categoria")}
options={opcoes.includes(dados.categoria) ? opcoes : [dados.categoria, ...opcoes]} />
<Campo label="Valor (R$)" type="number" min="0.01" step="0.01" value={dados.valor} onChange={mudar("valor")} required />
<Campo label="Data" type="date" value={dados.dt_lancamento} onChange={mudar("dt_lancamento")} required />
</div>
<CampoSelecao label="Status" value={dados.status} onChange={mudar("status")} options={["Pendente", "Pago"]} />
{erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
<button type="submit" hidden tabIndex={-1} />
</form>
</Modal>;
}