import { useCallback, useEffect, useState } from "react";
import { Botao } from "@/components/ui";
import { hojeISO } from "@/lib/data.js";
export default function PagamentosDER({ api, onChange }) {
 const [anuidades, setAnuidades] = useState([]);
 const [mensalidades, setMensalidades] = useState([]);
 const [erro, setErro] = useState("");
 const [carregando, setCarregando] = useState(true);
 const [form, setForm] = useState({
 tipo: "anuidade", fkFamilia: "", fkAnuidade: "",
 fkDepartamento: "", fkMensalidade: "", formaPagamento: "Pix",
 });
 const atualizar = useCallback(async () => {
 try {
 setCarregando(true);
 setErro("");
 const [pagamentos, pagamentosDepartamento] = await Promise.all([
 api.pagamentos(), api.pagamentosDepartamento(),
 ]);
 setAnuidades(pagamentos);
 setMensalidades(pagamentosDepartamento);
 } catch (falha) {
 setErro(falha.message);
 } finally {
 setCarregando(false);
 }
 }, [api]);
 useEffect(() => { atualizar(); }, [atualizar]);
 const executar = async (operacao) => {
 try {
 setErro("");
 await operacao();
 await atualizar();
 onChange();
 } catch (falha) {
 setErro(falha.message);
 }
 };
 const revisar = (tipo, pagamento, aceitar) => executar(() => {
 if (tipo === "anuidade") {
 return aceitar
 ? api.confirmarPagamento(pagamento.idPagamento, hojeISO())
 : api.recusarPagamento(pagamento.idPagamento);
 }
 return aceitar
 ? api.confirmarPagamentoDepartamento(pagamento.idPagamentoDepartamento, hojeISO())
 : api.recusarPagamentoDepartamento(pagamento.idPagamentoDepartamento);
 });
 const enviar = (evento) => {
 evento.preventDefault();
 executar(() => form.tipo === "anuidade"
 ? api.criarPagamento({
 fkFamilia: Number(form.fkFamilia),
 fkAnuidade: Number(form.fkAnuidade),
 formaPagamento: form.formaPagamento,
 })
 : api.criarPagamentoDepartamento({
 fkDepartamento: Number(form.fkDepartamento),
 fkMensalidade: Number(form.fkMensalidade),
 formaPagamento: form.formaPagamento,
 }));
 };
 const alterar = (campo) => (evento) => setForm((anterior) => ({ ...anterior, [campo]: evento.target.value }));
 return (
 <section className="space-y-5">
 <p className="text-sm text-muted">
 Pagamentos conforme o DER v5. Não existem campos de comprovante ou justificativa de recusa nesse modelo.
 </p>
 {erro && <p role="alert" className="text-danger">{erro}</p>}
 {carregando && <p role="status" className="text-muted">Atualizando pagamentos...</p>}
 <form onSubmit={enviar} className="space-y-3 rounded-xl border p-4">
 <strong>Novo pagamento pendente</strong>
 <div className="flex flex-wrap gap-3">
 <select value={form.tipo} onChange={alterar("tipo")} className="rounded border p-2">
 <option value="anuidade">Anuidade da família</option>
 <option value="mensalidade">Mensalidade do departamento</option>
 </select>
 {form.tipo === "anuidade" ? (
 <>
 <input required type="number" min="1" placeholder="fkFamilia" value={form.fkFamilia}
 onChange={alterar("fkFamilia")} className="rounded border p-2" />
 <input required type="number" min="1" placeholder="fkAnuidade" value={form.fkAnuidade}
 onChange={alterar("fkAnuidade")} className="rounded border p-2" />
 </>
 ) : (
 <>
 <input required type="number" min="1" placeholder="fkDepartamento" value={form.fkDepartamento}
 onChange={alterar("fkDepartamento")} className="rounded border p-2" />
 <input required type="number" min="1" placeholder="fkMensalidade" value={form.fkMensalidade}
 onChange={alterar("fkMensalidade")} className="rounded border p-2" />
 </>
 )}
 <input required placeholder="formaPagamento" value={form.formaPagamento}
 onChange={alterar("formaPagamento")} className="rounded border p-2" />
 <Botao type="submit">Criar pendência</Botao>
 </div>
 </form>
 <h3 className="font-bold">Pagamentos de anuidades</h3>
 {anuidades.map((pagamento) => (
 <div key={pagamento.idPagamento} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
 <span>#{pagamento.idPagamento} · Família {pagamento.fkFamilia} · Anuidade {pagamento.fkAnuidade} · {pagamento.status}</span>
 {pagamento.status?.toLowerCase() === "pendente" && (
 <div className="flex gap-2">
 <Botao onClick={() => revisar("anuidade", pagamento, true)}>Confirmar</Botao>
 <Botao variant="outline" onClick={() => revisar("anuidade", pagamento, false)}>Recusar</Botao>
 </div>
 )}
 </div>
 ))}
 <h3 className="font-bold">Pagamentos de mensalidades</h3>
 {mensalidades.map((pagamento) => (
 <div key={pagamento.idPagamentoDepartamento} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
 <span>#{pagamento.idPagamentoDepartamento} · Departamento {pagamento.fkDepartamento} · Mensalidade {pagamento.fkMensalidade} · {pagamento.status}</span>
 {pagamento.status?.toLowerCase() === "pendente" && (
 <div className="flex gap-2">
 <Botao onClick={() => revisar("mensalidade", pagamento, true)}>Confirmar</Botao>
 <Botao variant="outline" onClick={() => revisar("mensalidade", pagamento, false)}>Recusar</Botao>
 </div>
 )}
 </div>
 ))}
 </section>
 );
}