import { useMemo, useState } from "react";
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
