import { useState } from "react";
import { Botao, Modal } from "@/components/ui";
export default function DespesasForm({ registro, onClose, onSave }) {
 const [dados, setDados] = useState({
 dtDepesa: registro.date || new Date().toISOString().slice(0, 10),
 descricao: registro.description || "",
 categoria: registro.category || "Materiais",
 valor: registro.amount ?? "",
 status: registro.status || "Pendente",
 // Utilize o ID verdadeiro da tabela Usuario; o DER nao define login/token.
 fkUsuario: registro.fkUsuario ?? "", fkFamilia: registro.fkFamilia ?? "",
 });
 const [erro, setErro] = useState("");
 const editar = (campo) => (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));
 function enviar() {
 const valor = Number(dados.valor);
 if (!dados.dtDepesa || dados.descricao.trim().length < 3 || valor <= 0 || !dados.fkUsuario) {
 setErro("Informe data, descricao, valor positivo e fkUsuario real."); return;
 }
 onSave({ dtDepesa: dados.dtDepesa, descricao: dados.descricao.trim(),
 categoria: dados.categoria.trim(), valor, status: dados.status,
 fkUsuario: Number(dados.fkUsuario),
 fkFamilia: dados.fkFamilia ? Number(dados.fkFamilia) : null });
 }
 const campo = (rotulo, prop, type = "text") => <label className="grid gap-1 text-sm">{rotulo}<input
 className="rounded-lg border px-3 py-2" type={type} value={dados[prop]}
 onChange={editar(prop)} /></label>;
 return <Modal title={registro.id ? "Editar Despesas" : "Cadastrar Despesas"} onClose={onClose}
 footer={<><Botao variant="outline" onClick={onClose}>Cancelar</Botao><Botao
onClick={enviar}>Salvar</Botao></>}>
 <div className="grid gap-3 sm:grid-cols-2">
 {campo("dtDepesa", "dtDepesa", "date")}
 {campo("descricao", "descricao")}
 {campo("categoria", "categoria")}
 {campo("valor (R$)", "valor", "number")}
 <label className="grid gap-1 text-sm">status<select className="rounded-lg border px-3 py-2"
value={dados.status}
 onChange={editar("status")}><option>Pago</option><option>Pendente</option></select></label>
 {campo("fkUsuario (ID do banco)", "fkUsuario", "number")}
 {campo("fkFamilia (opcional)", "fkFamilia", "number")}
 {erro && <p className="text-danger sm:col-span-2">{erro}</p>}
 </div>
 </Modal>;
}
