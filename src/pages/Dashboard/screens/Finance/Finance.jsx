import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarArmazenamento } from "@/store";
import { baixarCsv, formatarData, formatarMoeda, chaveMes, hojeISO } from "@/lib/data.js";
import { somar } from "@/lib/finance.js";
import { Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca,
CampoSelecao, SeloStatus, Abas, Cartao } from "@/components/ui";
import Graficos from "./Charts.jsx";
import LancamentoForm from "./LancamentoForm.jsx";
import CobrancasAdmin from "./CobrancasAdmin.jsx";
import MeusPagamentos from "./MeusPagamentos.jsx";
import { criarServicoFinanceiro } from "@/services/financeiroApi.js";
function CartaoSaldo({ titulo, valor, detalhe, perigo }) {
return <Cartao className="min-w-0 border-l-4 border-l-accent p-5 sm:p-6">
<p className="text-sm font-medium text-muted">{titulo}</p>
<p className="mt-2 break-words text-3xl font-bold tabular-nums text-brand">{formatarMoeda(Number(valor || 0))}</p>
<p className={`mt-2 text-xs ${perigo ? "text-danger" : "text-muted"}`}>{detalhe}</p>
</Cartao>;
}
export default function Financas() {
const { requisitar, podeAcessar } = usarAutenticacao();
const { toast: aviso, confirm: confirmar } = usarArmazenamento();
const api = useMemo(() => criarServicoFinanceiro(requisitar), [requisitar]);
const diretoria = podeAcessar("TELA_FINANCEIRO");
const hoje = hojeISO();
const ano = Number(hoje.slice(0, 4));
const mes = Number(hoje.slice(5, 7));
const [dashboard, setDashboard] = useState(null);
const [carregando, setCarregando] = useState(true);
const [erro, setErro] = useState("");
const [versao, setVersao] = useState(0);
const [aba, setAba] = useState("relatorio");
const [formulario, setFormulario] = useState(null);
const [ocupado, setOcupado] = useState(false);
const emCurso = useRef(false);
const [filtros, setFiltros] = useState({ q: "", status: "Todos", type: "Todos", period: "Este ano" });
const atualizar = useCallback(() => setVersao((x) => x + 1), []);
useEffect(() => {
if (!diretoria) return undefined;
const controle = new AbortController();
setCarregando(true);
api.dashboard(ano, mes, { signal: controle.signal }).then((d) => {
if (!controle.signal.aborted) {setDashboard(d);setErro("");}
}).catch((e) => {if (!controle.signal.aborted) setErro(e.message);})
.finally(() => {if (!controle.signal.aborted) setCarregando(false);});
return () => controle.abort();
}, [api, diretoria, ano, mes, versao]);

// Associados não acessam dados globais: a API de cobranças filtra pelo JWT.
if (!diretoria) return <MeusPagamentos api={api} />;
const todos = (dashboard?.transactions || []).filter((t) =>
!t.id.startsWith("PCO-") || t.status === "Pago");
const filtrados = [...todos].filter((t) => filtros.period === "Este ano" ?
t.date.startsWith(String(ano)) : filtros.period === "Este mês" ?
chaveMes(t.date) === chaveMes(hoje) : true)
.filter((t) => filtros.status === "Todos" || t.status === filtros.status)
.filter((t) => filtros.type === "Todos" || t.type === (filtros.type === "Entradas" ? "in" : "out"))
.filter((t) => !filtros.q.trim() || `${t.description} ${t.category}`.toLowerCase()
.includes(filtros.q.trim().toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
const confirmados = filtrados.filter((t) => t.status === "Pago");
const atualizarFiltro = (campo) => (valor) => setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
const executar = async (operacao, mensagem, propagar = false) => {
if (emCurso.current) return false;
emCurso.current = true;setOcupado(true);
try {await operacao();aviso(mensagem);atualizar();return true;}
catch (falha) {if (propagar) throw falha;aviso(falha.message, "error");return false;}
finally {emCurso.current = false;setOcupado(false);}
};
const salvar = async (dados) => {
const id = formulario?.id && formulario.id.startsWith("LAN-") ? Number(formulario.id.slice(4)) : null;
const sucesso = await executar(() => id ? api.editarLancamento(id,dados) : api.criarLancamento(dados),
"Lançamento salvo com sucesso", true);
if (sucesso) setFormulario(null); 75
};
const remover = (t) => confirmar({
title: "Excluir lançamento", message: `Deseja excluir “${t.description}”? Essa ação não pode ser desfeita.`,
onConfirm: () => executar(() => api.excluirLancamento(Number(t.id.slice(4))),"Lançamento excluído")
});
const exportar = () => {
baixarCsv(`relatorio-financeiro-${hoje}.csv`,["Data","Descrição","Categoria","Tipo","Valor","Status"],
filtrados.map(t => [formatarData(t.date),t.description,t.category,t.type === "in" ? "Entrada" : "Saída",
t.amount.toFixed(2).replace(".",","),t.id.startsWith("PCO-") ? "Pagamento recebido" : t.status]));
aviso("Relatório exportado");
};
const colunas = [
{ key: "date", label: "Data", render: t => formatarData(t.date) },
{ key: "description", label: "Descrição" },
{ key: "category", label: "Categoria" },
{ key: "amount", label: "Valor", render: t => <strong className={t.type === "out" ? "text-danger" : "text-success"}>
{t.type === "out" ? "− " : "+ "}{formatarMoeda(t.amount)}</strong> },
{ key: "status", label: "Status", render: t => t.id.startsWith("PCO-") ?
<span className="text-sm font-semibold text-success">Pagamento recebido</span> : <SeloStatus status={t.status} /> },
];
if (carregando && !dashboard) return <Cartao className="p-6">Carregando dados financeiros...</Cartao>;
if (!dashboard) return <Cartao className="space-y-3 p-5"><p role="alert" className="text-danger">{erro || "Falha ao carregar o financeiro"}</p>
<Botao onClick={atualizar}>Tentar novamente</Botao></Cartao>;
const r = dashboard.resumo;
const variacao = r.variacao_mensal;
const resumoDetalhe = `Entradas ${formatarMoeda(Number(r.entradas_anuais))} · Saídas ${formatarMoeda(Number(r.saidas_anuais))}`;
return <div className="space-y-6">
<div className="flex flex-wrap items-end justify-between gap-5">
<div className="grid w-full max-w-4xl flex-1 gap-4 md:grid-cols-2">
<CartaoSaldo titulo="Saldo mensal" valor={r.saldo_mensal} perigo={Number(variacao)<0}
detalhe={variacao == null ? "Sem saldo anterior para comparação" :
`${Number(variacao)>0?"+":""}${Number(variacao).toFixed(1).replace(".",",")}% em relação ao mês anterior`} />
<CartaoSaldo titulo="Saldo anual" valor={r.saldo_anual} detalhe={resumoDetalhe} />
</div>
<Botao onClick={() => setFormulario({})}><Icone name="plus" size={18} /> Novo lançamento</Botao>
</div>
{erro && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{erro} Os números exibidos são da última
consulta.</p>}
<Abas value={aba} onChange={setAba} options={[
{ value: "relatorio", label: "Relatório financeiro" },
{ value: "pagamentos", label: "Verificar pagamentos" },
{ value: "reembolsos", label: "Verificar reembolsos" },
]} />
{aba === "pagamentos" ? <CobrancasAdmin api={api} onChange={atualizar} /> :
aba === "reembolsos" ? <Cartao className="p-6"><h2 className="font-bold">Verificar reembolsos</h2>
<p className="mt-2 text-sm text-muted">O DER financeiro vigente não possui campos para solicitação e análise de reembolsos.
O cadastro de uma saída na categoria Reembolsos continua disponível no Relatório financeiro. Nenhuma solicitação fictícia será enviada.</p></Cartao> : <>
<Graficos all={todos} year={String(ano)} />
<section className="space-y-4" aria-label="Relatório financeiro">
<div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Relatório financeiro</h2>
<p className="text-sm text-muted">Pagamentos recebidos após confirmação da Diretoria e lançamentos registrados.</p></div>
<Botao variant="outline" disabled={!filtrados.length} onClick={exportar}><Icone name="download" size={16}/> Exportar CSV</Botao></div>
<Cartao className="space-y-4 p-4 sm:p-5">
<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
<div><span className="mb-2 block text-sm font-semibold">Buscar lançamento</span>
<EntradaBusca value={filtros.q} onChange={atualizarFiltro("q")} placeholder="Descrição ou categoria" /></div>
<CampoSelecao label="Período" value={filtros.period} onChange={atualizarFiltro("period")} options={["Este mês","Este ano","Todos"]} />
<CampoSelecao label="Tipo" value={filtros.type} onChange={atualizarFiltro("type")} options={["Todos","Entradas","Saídas"]} />
<CampoSelecao label="Status" value={filtros.status} onChange={atualizarFiltro("status")} options={["Todos","Pendente","Pago"]} />
</div>
<div className="flex flex-wrap gap-5 border-t border-divider pt-3 text-xs text-muted">
<span>{filtrados.length} lançamentos</span>
<span>Entradas confirmadas <b className="text-success">{formatarMoeda(somar(confirmados.filter(t=>t.type==="in")))}</b>
</span>
<span>Saídas pagas <b className="text-danger">{formatarMoeda(somar(confirmados.filter(t=>t.type==="out")))}</b></span>
</div>
</Cartao>
<TabelaDados rows={filtrados} columns={colunas} empty={<EstadoVazio icon="wallet" title="Nenhum lançamento encontrado" />}
actions={(item) => item.locked ? <span className="text-xs text-muted">Recebimento confirmado</span> : <>
{item.status === "Pendente" && <BotaoIcone icon="check" label="Confirmar lançamento" size="sm" disabled={ocupado}
onClick={() => executar(() => api.confirmarLancamento(Number(item.id.slice(4))),"Lançamento confirmado")} />}
<BotaoIcone icon="edit" label="Editar lançamento" size="sm" disabled={ocupado} onClick={() => setFormulario(item)} />
<BotaoIcone icon="trash" label="Excluir lançamento" size="sm" tone="danger" disabled={ocupado} onClick={() => remover(item)} />
</>} />
</section>
</>}
{formulario && <LancamentoForm registro={formulario} onClose={() => setFormulario(null)} onSave={salvar} />}
</div>;
}