/*import { useMemo, useState } from "react";
import { baixarCsv, formatarData, formatarMoeda, ehPapelFamiliar, chaveMes, hojeISO } from "@/lib/data.js";
import { saldoDe, estadoTaxa, transacoesDoEscopo, somar } from "@/lib/finance.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca, CampoSelecao, SeloStatus, Abas } from "@/components/ui";
import Metrica from "@/pages/Dashboard/components/Metric.jsx";
import Graficos from "./Charts.jsx";
import FormularioTransacao from "./TransactionForm.jsx";
import PaginaPagamento from "./requests/PaymentPage.jsx";
import ModalReembolso from "./requests/RefundModal.jsx";
import TabelaSolicitacoes from "./requests/RequestsTable.jsx";
import { comTipo } from "./requests/helpers.js";

export default function Financas({ role: papel, account: conta }) {
  const { state: dadosAplicacao, save: salvar, remove: remover, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const hoje = hojeISO();
  const podeEditar = !ehPapelFamiliar(papel);
  const [filtros, definirFiltros] = useState({ q: "", status: "Todos", type: "Todos", period: "Este ano" });
  const [editando, definirEditando] = useState(null); // transação (nova ou existente)
  const [pagando, definirPagando] = useState(false); // abre a página de pagamento
  const [reembolsando, definirReembolsando] = useState(false);
  const [aba, definirAba] = useState("ledger");

  const todos = useMemo(() => transacoesDoEscopo(dadosAplicacao, usuario.scope), [dadosAplicacao, usuario.scope]);
  const ano = hoje.slice(0, 4);
  const taxa = papel === "admin" ? null : estadoTaxa(dadosAplicacao, papel, usuario.scope);

  const filtrado = useMemo(() => {
    const consulta = filtros.q.trim().toLowerCase();
    return todos
      .filter((tempo) => (filtros.period === "Este ano" ? tempo.date.startsWith(ano) : filtros.period === "Este mês" ? chaveMes(tempo.date) === chaveMes(hoje) : true))
      .filter((tempo) => filtros.status === "Todos" || tempo.status === filtros.status)
      .filter((tempo) => filtros.type === "Todos" || tempo.type === (filtros.type === "Entradas" ? "in" : "out"))
      .filter((tempo) => !consulta || `${tempo.description} ${tempo.category}`.toLowerCase().includes(consulta))
      .sort((elementoA, elementoB) => elementoB.date.localeCompare(elementoA.date));
  }, [todos, filtros, ano, hoje]);

  // métricas
  const mesAtual = saldoDe(todos.filter((tempo) => chaveMes(tempo.date) === chaveMes(hoje)));
  const dataAnterior = new Date(Number(ano), Number(hoje.slice(5, 7)) - 2, 1);
  const chaveAnterior = `${dataAnterior.getFullYear()}-${String(dataAnterior.getMonth() + 1).padStart(2, "0")}`;
  const mesAnterior = saldoDe(todos.filter((tempo) => chaveMes(tempo.date) === chaveAnterior));
  const alteracao = mesAnterior !== 0 ? ((mesAtual - mesAnterior) / Math.abs(mesAnterior)) * 100 : null;
  const saldoAnual = saldoDe(todos.filter((tempo) => tempo.date.startsWith(ano)));
  const entradasAnuais = somar(todos.filter((tempo) => tempo.date.startsWith(ano) && tempo.type === "in" && tempo.status === "Pago"));
  const saidasAnuais = somar(todos.filter((tempo) => tempo.date.startsWith(ano) && tempo.type === "out" && tempo.status === "Pago"));

  const definirFiltro = (chave) => (valor) => definirFiltros((elementoF) => ({ ...elementoF, [chave]: valor }));

  const removerTransacao = (tempo) => confirmar({ title: "Excluir lançamento", message: `Excluir “${tempo.description}” (${formatarMoeda(tempo.amount)})? Essa ação não pode ser desfeita.`, onConfirm: () => { remover("transactions", tempo.id); aviso("Lançamento excluído"); } });
  const marcarComoPago = (tempo) => { salvar("transactions", { ...tempo, status: "Pago" }); aviso("Marcado como pago"); };

  const exportarCsv = () => {
    baixarCsv(`financeiro-${hoje}.csv`, ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"], filtrado.map((tempo) => [formatarData(tempo.date), tempo.description, tempo.category, tempo.type === "in" ? "Entrada" : "Saída", tempo.amount.toFixed(2).replace(".", ","), tempo.status]));
    aviso("Arquivo CSV gerado");
  };

  const meusPagamentos = dadosAplicacao.payments.filter((parametro) => papel === "admin" || parametro.scope === usuario.scope);
  const meusReembolsos = dadosAplicacao.refunds.filter((resultado) => papel === "admin" || resultado.scope === usuario.scope);
  const pagamentosPendentes = dadosAplicacao.payments.filter((parametro) => parametro.status === "Em verificação").length;
  const reembolsosPendentes = dadosAplicacao.refunds.filter((resultado) => resultado.status === "Em análise").length;
  const meuAberto = [...meusPagamentos, ...meusReembolsos].filter((resultado) => resultado.status === "Em verificação" || resultado.status === "Em análise").length;

  if (pagando && taxa) return <PaginaPagamento role={papel} user={usuario} fee={taxa} onBack={() => definirPagando(false)} />;

  const colunas = [
    { key: "date", label: "Data", render: (tempo) => formatarData(tempo.date) },
    { key: "description", label: "Descrição" },
    { key: "category", label: "Categoria" },
    { key: "amount", label: "Valor", render: (tempo) => <span className={`whitespace-nowrap font-semibold ${tempo.type === "out" ? "text-danger" : "text-success"}`}>{tempo.type === "out" ? "- " : ""}{formatarMoeda(tempo.amount)}</span> },
    { key: "status", label: "Status", render: (tempo) => <SeloStatus status={tempo.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {papel === "admin" ? (
          <>
            <Metrica label="Saldo mensal" value={formatarMoeda(mesAtual)} trend={alteracao === null ? "Sem comparação com o mês anterior" : `${alteracao >= 0 ? "+" : "−"} ${Math.abs(alteracao).toFixed(1).replace(".", ",")}% em relação ao mês anterior`} tone={alteracao === null ? "muted" : alteracao >= 0 ? "success" : "danger"} />
            <Metrica label="Saldo anual" value={formatarMoeda(saldoAnual)} trend={`Entradas ${formatarMoeda(entradasAnuais)} · Saídas ${formatarMoeda(saidasAnuais)}`} tone="muted" />
          </>
        ) : (
          <>
            {papel === "department" && <Metrica label="Saldo do departamento" value={formatarMoeda(saldoDe(todos))} trend={`Neste mês: ${formatarMoeda(mesAtual)}`} tone="muted" />}
            <Metrica label={taxa.label} value={taxa.paid ? "Pago" : taxa.pendingPayment ? "Em verificação" : taxa.rejected ? "Recusado" : "Em aberto"} trend={taxa.paid ? `Pagamento confirmado em ${formatarData(taxa.tx.date)}` : taxa.pendingPayment ? "Aguardando verificação da Diretoria" : taxa.rejected ? "Comprovante recusado — envie novamente" : `Vencimento ${formatarData(taxa.dueDate)}${taxa.overdue ? " (vencida)" : ""}`} tone={taxa.paid ? "success" : taxa.pendingPayment ? "muted" : "danger"} />
            <Metrica label="Valor" value={formatarMoeda(taxa.amount)} trend={taxa.period === "mensal" ? "Cobrança mensal" : "Cobrança anual"} tone="muted" />
          </>
        )}
        <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
          {podeEditar && <Botao onClick={() => definirEditando({ date: hoje, description: "", category: "Outros", type: "out", amount: "", status: "Pago", scope: usuario.scope })}><Icone name="plus" size={18} /> Novo lançamento</Botao>}
          {taxa && !taxa.paid && !taxa.pendingPayment && <Botao variant={podeEditar ? "secondary" : "primary"} onClick={() => definirPagando(true)}>Pagar {papel === "department" ? "mensalidade" : "anuidade"}</Botao>}
          {papel !== "admin" && <Botao variant="outline" onClick={() => definirReembolsando(true)}>Solicitar reembolso</Botao>}
        </div>
      </div>

      <Abas value={aba} onChange={definirAba} options={papel === "admin"
        ? [{ value: "ledger", label: "Lançamentos" }, { value: "payments", label: `Verificar pagamentos${pagamentosPendentes ? ` (${pagamentosPendentes})` : ""}` }, { value: "refunds", label: `Verificar reembolsos${reembolsosPendentes ? ` (${reembolsosPendentes})` : ""}` }]
        : [{ value: "ledger", label: "Lançamentos" }, { value: "requests", label: `Meus envios${meuAberto ? ` (${meuAberto})` : ""}` }]} />

      {aba === "payments" && papel === "admin" && <TabelaSolicitacoes items={comTipo(meusPagamentos, [])} canReview />}
      {aba === "refunds" && papel === "admin" && <TabelaSolicitacoes items={comTipo([], meusReembolsos)} canReview />}
      {aba === "requests" && papel !== "admin" && <TabelaSolicitacoes items={comTipo(meusPagamentos, meusReembolsos)} showOwner={false} />}

      {aba === "ledger" && <>
      {podeEditar && <Graficos all={todos} year={ano} />}

      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <EntradaBusca value={filtros.q} onChange={definirFiltro("q")} placeholder="Buscar por descrição ou categoria" />
          <CampoSelecao label="" value={filtros.period} onChange={definirFiltro("period")} options={["Este mês", "Este ano", "Todos"]} className="[&>span:first-child]:hidden" />
          <CampoSelecao label="" value={filtros.type} onChange={definirFiltro("type")} options={["Todos", "Entradas", "Saídas"]} className="[&>span:first-child]:hidden" />
          <CampoSelecao label="" value={filtros.status} onChange={definirFiltro("status")} options={["Todos", "Pago", "Pendente", "Em verificação", "Recusado"]} className="[&>span:first-child]:hidden" />
          <Botao variant="outline" onClick={exportarCsv} disabled={!filtrado.length}><Icone name="download" size={18} /> Exportar</Botao>
        </div>
        <p className="text-sm text-muted">
          {filtrado.length} {filtrado.length === 1 ? "lançamento" : "lançamentos"} · Entradas <strong className="text-success">{formatarMoeda(somar(filtrado.filter((tempo) => tempo.type === "in")))}</strong> · Saídas <strong className="text-danger">{formatarMoeda(somar(filtrado.filter((tempo) => tempo.type === "out")))}</strong>
        </p>
      </div>

      <TabelaDados
        columns={colunas}
        rows={filtrado}
        empty={<EstadoVazio icon="wallet" title="Nenhum lançamento encontrado">Ajuste os filtros{podeEditar ? " ou crie um novo lançamento" : ""}.</EstadoVazio>}
        actions={podeEditar ? (tempo) => (tempo.paymentId || (tempo.fee && papel !== "admin") ? <span className="text-xs text-muted">Via verificação</span> : (
          <>
            {tempo.status === "Pendente" && <BotaoIcone icon="check" label="Marcar como pago" onClick={() => marcarComoPago(tempo)} size="sm" />}
            <BotaoIcone icon="edit" label="Editar" onClick={() => definirEditando(tempo)} size="sm" />
            <BotaoIcone icon="trash" label="Excluir" tone="danger" onClick={() => removerTransacao(tempo)} size="sm" />
          </>
        )) : undefined}
      />
      </>}

      {editando && <FormularioTransacao tx={editando} onClose={() => definirEditando(null)} onSave={(tempo) => { salvar("transactions", tempo); aviso(tempo.id ? "Lançamento atualizado" : "Lançamento criado"); definirEditando(null); }} />}
      {reembolsando && <ModalReembolso role={papel} user={usuario} onClose={() => definirReembolsando(false)} />}
    </div>
  );
}
  */

/*
import { useCallback, useEffect, useMemo, useState } from "react";
import { baixarCsv, formatarData, formatarMoeda, chaveMes, hojeISO } from "@/lib/data.js";
import { somar } from "@/lib/finance.js";
import { usarArmazenamento } from "@/store";
import { Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca, CampoSelecao, SeloStatus,
Abas } from "@/components/ui";
import Metrica from "@/pages/Dashboard/components/Metric.jsx";
import Graficos from "./Charts.jsx";
import DespesasForm from "./DespesasForm.jsx";
import PagamentosDER from "./PagamentosDER.jsx";
import { financeiroApi } from "@/services/financeiroApi.js";
export default function Financas({ role: papel, account: conta }) {
 const { toast: aviso, confirm: confirmar } = usarArmazenamento();
 const hoje = hojeISO();
const ano = Number(hoje.slice(0, 4));
 const mes = Number(hoje.slice(5, 7));
 const admin = papel === "admin";
 const [dashboard, setDashboard] = useState(null);
 const [carregando, setCarregando] = useState(true);
 const [erro, setErro] = useState("");
 const [versao, setVersao] = useState(0);
 const [aba, setAba] = useState("ledger");
 const [formulario, setFormulario] = useState(null);
 const [filtros, setFiltros] = useState({ q: "", status: "Todos", type: "Todos", period: "Este ano" });
 const atualizar = useCallback(() => setVersao((v) => v + 1), []);
 useEffect(() => {
 if (!admin) return undefined;
 let ativo = true;
 setCarregando(true); setErro("");
 financeiroApi.dashboard(ano, mes).then((r) => {
 if (ativo) setDashboard(r);
 }).catch((e) => { if (ativo) setErro(e.message); })
 .finally(() => { if (ativo) setCarregando(false); });
 return () => { ativo = false; };
 }, [admin, ano, mes, versao]);
 const todos = dashboard?.transactions ?? [];
 const filtrado = useMemo(() => {
 const q = filtros.q.trim().toLowerCase();
 return todos.filter((t) => filtros.period === "Este ano" ? t.date.startsWith(String(ano)) :
 filtros.period === "Este mês" ? chaveMes(t.date) === chaveMes(hoje) : true)
 .filter((t) => filtros.status === "Todos" || t.status === filtros.status)
 .filter((t) => filtros.type === "Todos" || t.type === (filtros.type === "Entradas" ? "in" : "out"))
 .filter((t) => !q || `${t.description} ${t.category}`.toLowerCase().includes(q))
 .sort((a, b) => b.date.localeCompare(a.date));
 }, [todos, filtros, ano, hoje]);
 const executar = async (funcao, mensagem) => {
 try { await funcao(); aviso(mensagem); atualizar(); }
 catch (e) { aviso(e.message, "error"); }
 };
 const remover = (t) => confirmar({
 title: "Excluir despesa", message: `Excluir ${t.description}?`,
 onConfirm: () => executar(() => financeiroApi.excluirDespesa(Number(t.id.slice(4))), "Despesa
excluida"),
 });
 const salvar = async (dados) => {
 try {
 if (formulario?.id) await financeiroApi.editarDespesa(Number(formulario.id.slice(4)), dados);
 else await financeiroApi.criarDespesa(dados);
 aviso("Despesa salva no PostgreSQL"); setFormulario(null); atualizar();
 } catch (e) { aviso(e.message, "error"); }
 };
 const exportar = () => {
 baixarCsv(`financeiro-${hoje}.csv`, ["Data", "Descricao", "Categoria", "Tipo", "Valor", "Status"],
 filtrado.map((t) => [formatarData(t.date), t.description, t.category,
 t.type === "in" ? "Entrada" : "Saida", t.amount.toFixed(2).replace(".", ","), t.status]));
 aviso("CSV exportado");
 };
 const colunas = [
 { key: "date", label: "Data", render: (t) => formatarData(t.date) },
 { key: "description", label: "Descricao" },
 { key: "category", label: "Categoria" },
 { key: "amount", label: "Valor", render: (t) => <span className={t.type === "out" ? "text-danger" :
"text-success"}>{t.type === "out" ? "- " : ""}{formatarMoeda(t.amount)}</span> },
 { key: "status", label: "Status", render: (t) => <SeloStatus status={t.status} /> },
 ];
 if (!admin) return <p className="rounded-xl border p-5 text-sm">O acesso financeiro deste perfil exige
autenticacao e vinculo real de Usuario/Familia/Departamento no backend. Os dados da Diretoria nao sao
exibidos aqui.</p>;
 if (carregando && !dashboard) return <p>Carregando dados do PostgreSQL...</p>;
 if (erro) return <div className="space-y-3"><p className="text-danger">{erro}</p><Botao
onClick={atualizar}>Tentar novamente</Botao></div>;
 if (!dashboard) return null;
 const resumo = dashboard.resumo;
 return (
 <div className="space-y-6">
 <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
 <Metrica label="Saldo mensal" value={formatarMoeda(Number(resumo.saldoMensal))} tone="muted"
 trend={resumo.variacaoMensal == null ? "Sem mes anterior comparavel" : `${Number(resumo.
variacaoMensal).toFixed(1)}% em relacao ao mes anterior`} />
 <Metrica label="Saldo anual" value={formatarMoeda(Number(resumo.saldoAnual))} tone="muted"
 trend={`Entradas ${formatarMoeda(Number(resumo.entradasAnuais))} · Saidas
${formatarMoeda(Number(resumo.saidasAnuais))}`} />
{admin && <div className="flex items-end justify-end"><Botao onClick={() =>
setFormulario({})}><Icone name="plus" size={18} /> Nova despesa</Botao></div>}
 </div>
 {admin && <Abas value={aba} onChange={setAba} options={[{value:"ledger",label:"Lancamentos"},
{value:"payments",label:"Verificar pagamentos"}]} />}
 {aba === "payments" && admin ? <PagamentosDER onChange={atualizar} /> : <>
 {admin && <Graficos all={todos} year={String(ano)} />}
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
 <EntradaBusca value={filtros.q} onChange={(q) => setFiltros((f) => ({...f,q}))}
placeholder="Buscar por descricao ou categoria" />
 <CampoSelecao label="" value={filtros.period} onChange={(period) => setFiltros((f) => ({...f,
period}))} options={["Este mês", "Este ano", "Todos"]} />
 <CampoSelecao label="" value={filtros.type} onChange={(type) => setFiltros((f) => ({...f,
type}))} options={["Todos", "Entradas", "Saídas"]} />
 <CampoSelecao label="" value={filtros.status} onChange={(status) => setFiltros((f) => ({...f,
status}))} options={["Todos", "Pago", "Pendente", "Recusado"]} />
 <Botao variant="outline" onClick={exportar}><Icone name="download" size={18} />
Exportar</Botao>
 </div>
 <p className="text-sm text-muted">{filtrado.length} lancamentos · Entradas
{formatarMoeda(somar(filtrado.filter((t) => t.type === "in" && t.status === "Pago")))} · Saidas
{formatarMoeda(somar(filtrado.filter((t) => t.type === "out" && t.status === "Pago")))}</p>
 <TabelaDados columns={colunas} rows={filtrado} empty={<EstadoVazio icon="wallet" title="Sem
lancamentos" />}
 actions={admin ? (t) => t.locked ? <span className="text-xs text-muted">Pagamento do
DER</span> : <>
 {t.status === "Pendente" && <BotaoIcone icon="check" label="Confirmar" size="sm" onClick={()
=> executar(() => financeiroApi.confirmarDespesa(Number(t.id.slice(4))), "Despesa confirmada")} />}
 <BotaoIcone icon="edit" label="Editar" size="sm" onClick={() => setFormulario(t)} />
 <BotaoIcone icon="trash" label="Excluir" size="sm" tone="danger" onClick={() => remover(t)}
/>
 </> : undefined}
 />
 </>}
 {formulario && <DespesasForm registro={formulario} onClose={() => setFormulario(null)}
onSave={salvar} />}
 <p className="text-xs text-muted">Categorias Kifu/aluguel, comprovantes e reembolsos precisam de
tabelas adicionais: nao constam no DER v5. Esta edicao nao inventa esses dados.</p>
 </div>
 );
}
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarArmazenamento } from "@/store";
import { baixarCsv, formatarData, formatarMoeda, chaveMes, hojeISO } from "@/lib/data.js";
import { somar } from "@/lib/finance.js";
import {
 Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone,
 EntradaBusca, CampoSelecao, SeloStatus, Abas,
} from "@/components/ui";
import Metrica from "@/pages/Dashboard/components/Metric.jsx";
import Graficos from "./Charts.jsx";
import DespesasForm from "./DespesasForm.jsx";
import PagamentosDER from "./PagamentosDER.jsx";
import { criarServicoFinanceiro } from "@/services/financeiroApi.js";
export default function Financas() {
 const { usuario, requisitar, podeAcessar } = usarAutenticacao();
 const { toast: aviso, confirm: confirmar } = usarArmazenamento();
 const api = useMemo(() => criarServicoFinanceiro(requisitar), [requisitar]);
 const permitido = podeAcessar("TELA_FINANCEIRO");
 const hoje = hojeISO();
 const ano = Number(hoje.slice(0, 4));
 const mes = Number(hoje.slice(5, 7));
 const [dashboard, setDashboard] = useState(null);
 const [carregando, setCarregando] = useState(true);
 const [erro, setErro] = useState("");
 const [versao, setVersao] = useState(0);
 const [aba, setAba] = useState("ledger");
 const [formulario, setFormulario] = useState(null);
 const [filtros, setFiltros] = useState({ q: "", status: "Todos", type: "Todos", period: "Este ano" });

 const atualizar = useCallback(() => setVersao((versaoAtual) => versaoAtual + 1), []);
 useEffect(() => {
 if (!permitido) return undefined;

 const controle = new AbortController();
 setCarregando(true);
 setErro("");
 // O endpoint da Dashboard usa ano/mês para saldos, mas retorna lançamentos de vários períodos.
 api.dashboard(ano, mes, { signal: controle.signal })
 .then((dados) => { if (!controle.signal.aborted) setDashboard(dados); })
 .catch((falha) => {
 if (!controle.signal.aborted && falha.name !== "AbortError") setErro(falha.message);
 })
 .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
 return () => controle.abort();
 }, [api, permitido, ano, mes, versao]);

 const todos = useMemo(() => dashboard?.transactions ?? [], [dashboard]);

 const filtrado = useMemo(() => {

 const consulta = filtros.q.trim().toLowerCase();
 return todos
 .filter((item) => filtros.period === "Este ano"
 ? item.date?.startsWith(String(ano))
 : filtros.period === "Este mês" ? chaveMes(item.date) === chaveMes(hoje) : true)
 .filter((item) => filtros.status === "Todos" || item.status === filtros.status)
 .filter((item) => filtros.type === "Todos" || item.type === (filtros.type === "Entradas" ? "in" : "out"))
 .filter((item) => !consulta || `${item.description} ${item.category}`.toLowerCase().includes(consulta))
 .sort((a, b) => b.date.localeCompare(a.date));
 }, [todos, filtros, ano, hoje]);

  const executar = async (operacao, mensagem) => {
 try {
 await operacao();
 aviso(mensagem);
 atualizar();
 } catch (falha) {
 aviso(falha.message, "error");
 }
 };

 const remover = (lancamento) => confirmar({
 title: "Excluir despesa",
 message: `Deseja excluir “${lancamento.description}”? Essa ação não pode ser desfeita.`,
 onConfirm: () => executar(
 () => api.excluirDespesa(Number(lancamento.id.slice(4))),
 "Despesa excluída com sucesso",
 ),
 });

 const salvar = async (dados) => {
 try {
 if (formulario?.id) {
 await api.editarDespesa(Number(formulario.id.slice(4)), dados);
 } else {
 await api.criarDespesa(dados);
 }
 aviso("Despesa salva no PostgreSQL");
 setFormulario(null);
 atualizar();
 } catch (falha) {
 aviso(falha.message, "error");
 }
 };

 const exportar = () => {
 baixarCsv(`financeiro-${hoje}.csv`, ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"],
 filtrado.map((item) => [
 formatarData(item.date), item.description, item.category,
 item.type === "in" ? "Entrada" : "Saída",
 item.amount.toFixed(2).replace(".", ","), item.status,
 ]));
 aviso("Arquivo CSV exportado");
 };

 const colunas = [
 { key: "date", label: "Data", render: (item) => formatarData(item.date) },
 { key: "description", label: "Descrição" },
 { key: "category", label: "Categoria" },
 { key: "amount", label: "Valor", render: (item) => (
 <span className={`whitespace-nowrap font-semibold ${item.type === "out" ? "text-danger" : "text-success"}`}>
 {item.type === "out" ? "- " : ""}{formatarMoeda(item.amount)}
 </span>
 ) },
 { key: "status", label: "Status", render: (item) => <SeloStatus status={item.status} /> },
 ];
 if (!permitido) return <p className="rounded-xl border p-5 text-sm">Sem permissão para consultar o Financeiro.</p>;
 if (carregando && !dashboard) return <p role="status">Carregando dados financeiros...</p>;
 if (erro) return (
 <div className="space-y-3">
 <p role="alert" className="text-danger">{erro}</p>
 <Botao onClick={atualizar}>Tentar novamente</Botao>
 </div>
 );
 if (!dashboard) return null;

 const resumo = dashboard.resumo;
 return (
 <div className="space-y-6" aria-busy={carregando}>
 <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
 <Metrica
 label="Saldo mensal"
 value={formatarMoeda(Number(resumo.saldoMensal))}
 trend={resumo.variacaoMensal == null
 ? "Sem mês anterior comparável"
 : `${Number(resumo.variacaoMensal).toFixed(1)}% em relação ao mês anterior`}
 tone={Number(resumo.variacaoMensal) < 0 ? "danger" : "muted"}
 />
 <Metrica
 label="Saldo anual"
 value={formatarMoeda(Number(resumo.saldoMensal))}
 trend={resumo.variacaoMensal == null
 ? "Sem mês anterior comparável"
 : `${Number(resumo.variacaoMensal).toFixed(1)}% em relação ao mês anterior`}
 tone={Number(resumo.variacaoMensal) < 0 ? "danger" : "muted"}
 />
 <Metrica
 label="Saldo anual"
 value={formatarMoeda(Number(resumo.saldoAnual))}
 trend={`Entradas ${formatarMoeda(Number(resumo.entradasAnuais))} · Saídas ${formatarMoeda(Number(resumo.saidasAnuais))}`}
 tone="muted"
 />
 <div className="flex items-end justify-end">
 <Botao onClick={() => setFormulario({ fkUsuario: usuario.id })}>
 <Icone name="plus" size={18} /> Nova despesa
 </Botao>
 </div>
 </div>
 <Abas
 value={aba}
 onChange={setAba}
 options={[
 { value: "ledger", label: "Lançamentos" },
 { value: "payments", label: "Verificar pagamentos" },
 ]}
 />
 {aba === "payments" ? (
 <PagamentosDER api={api} onChange={atualizar} />
 ) : (
 <>
 <Graficos all={todos} year={String(ano)} />
 <div className="space-y-3">
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
 <EntradaBusca
 value={filtros.q}
 onChange={(q) => setFiltros((anterior) => ({ ...anterior, q }))}
 placeholder="Buscar por descrição ou categoria"
 />
 <CampoSelecao label="" value={filtros.period}
 onChange={(period) => setFiltros((anterior) => ({ ...anterior, period }))}
 options={["Este mês", "Este ano", "Todos"]} />
 <CampoSelecao label="" value={filtros.type}
 onChange={(type) => setFiltros((anterior) => ({ ...anterior, type }))}
 options={["Todos", "Entradas", "Saídas"]} />
 <CampoSelecao label="" value={filtros.status}
 onChange={(status) => setFiltros((anterior) => ({ ...anterior, status }))}
 options={["Todos", "Pago", "Pendente", "Recusado"]} />
 <Botao variant="outline" disabled={!filtrado.length} onClick={exportar}>
 <Icone name="download" size={18} /> Exportar
 </Botao>
 </div>
 <p className="text-sm text-muted">
 {filtrado.length} lançamentos · Entradas {formatarMoeda(somar(filtrado.filter((item) => item.type === "in" && item.status === "Pago")))} · Saídas {formatarMoeda(somar(filtrado.filter((item) => item.type === "out" && item.status === "Pago")))}
 </p>
 <TabelaDados
 columns={colunas}
 rows={filtrado}
 empty={<EstadoVazio icon="wallet" title="Nenhum lançamento encontrado" />}
 actions={(item) => item.locked
 ? <span className="text-xs text-muted">Pagamento do DER</span>
 : <>
 {item.status === "Pendente" && (
 <BotaoIcone icon="check" label="Confirmar" size="sm"
 onClick={() => executar(
 () => api.confirmarDespesa(Number(item.id.slice(4))),
 "Despesa confirmada",
 )} />
 )}
 <BotaoIcone icon="edit" label="Editar" size="sm" onClick={() => setFormulario(item)} />
 <BotaoIcone icon="trash" label="Excluir" size="sm" tone="danger" onClick={() => remover(item)} />
  </>
 }
 />
 </div>
 </>
 )}
 {formulario && (
 <DespesasForm
 registro={formulario}
 onClose={() => setFormulario(null)}
 onSave={salvar}
 />
 )}
 <p className="text-xs text-muted">
 O DER v5 não inclui tabelas para Kifu, aluguel do salão, comprovantes ou reembolsos.
 Essas funcionalidades não serão simuladas como pagamentos reais.
 </p>
 </div>
 );
}