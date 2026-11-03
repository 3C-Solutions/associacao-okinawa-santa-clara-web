import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarArmazenamento } from "@/store";
import { baixarCsv, formatarData, formatarMoeda, chaveMes, hojeISO } from "@/lib/data.js";
import { somar } from "@/lib/finance.js";
import { Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca, CampoSelecao, SeloStatus, Abas, Cartao } from "@/components/ui";
import Graficos from "./Charts.jsx";
import DespesasForm from "./DespesasForm.jsx";
import PagamentosDER from "./PagamentosDER.jsx";
import { criarServicoFinanceiro } from "@/services/financeiroApi.js";

function Resumo({ label, value, detail, principal, tone = "text-muted" }) {
  return <Cartao className={`min-w-0 p-5 ${principal ? "border-brand/20 bg-brand-soft/40" : ""}`}>
    <p className="text-sm font-medium text-muted">{label}</p>
    <p className={`mt-3 break-words text-2xl font-bold tracking-tight tabular-nums xl:text-3xl ${principal ? "text-brand" : "text-ink"}`}>{formatarMoeda(value)}</p>
    <p className={`mt-2 text-xs leading-relaxed ${tone}`}>{detail}</p>
  </Cartao>;
}

export default function Financas() {
  const { requisitar, podeAcessar } = usarAutenticacao();
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
  const [ocupado, setOcupado] = useState(false);
  const operacaoEmCurso = useRef(false);
  const [filtros, setFiltros] = useState({ q: "", status: "Todos", type: "Todos", period: "Este ano" });
  const atualizar = useCallback(() => setVersao((valor) => valor + 1), []);
  useEffect(() => {
    if (!permitido) return undefined;
    const controle = new AbortController();
    setCarregando(true);
    setErro("");
    api.dashboard(ano, mes, { signal: controle.signal })
      .then((dados) => { if (!controle.signal.aborted) setDashboard(dados); })
      .catch((falha) => { if (!controle.signal.aborted) setErro(falha.message); })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [api, permitido, ano, mes, versao]);
  const todos = useMemo(() => dashboard?.transactions ?? [], [dashboard]);
  const filtrado = useMemo(() => {
    const consulta = filtros.q.trim().toLocaleLowerCase("pt-BR");
    return todos
      .filter((item) => filtros.period === "Este ano" ? item.date.startsWith(String(ano)) : filtros.period === "Este mês" ? chaveMes(item.date) === chaveMes(hoje) : true)
      .filter((item) => filtros.status === "Todos" || item.status === filtros.status)
      .filter((item) => filtros.type === "Todos" || item.type === (filtros.type === "Entradas" ? "in" : "out"))
      .filter((item) => !consulta || `${item.description} ${item.category}`.toLocaleLowerCase("pt-BR").includes(consulta))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [todos, filtros, ano, hoje]);
  const executar = async (operacao, mensagem, propagar = false) => {
    if (operacaoEmCurso.current) return false;
    operacaoEmCurso.current = true;
    setOcupado(true);
    try {
      await operacao();
      aviso(mensagem);
      atualizar();
      return true;
    } catch (falha) {
      if (propagar) throw falha;
      aviso(falha.message, "error");
      return false;
    } finally {
      operacaoEmCurso.current = false;
      setOcupado(false);
    }
  };
  const remover = (item) => confirmar({ title: "Excluir despesa",
    message: `Deseja excluir “${item.description}” (${formatarMoeda(item.amount)})? Essa ação não pode ser desfeita.`,
    onConfirm: () => executar(() => api.excluirDespesa(Number(item.id.slice(4))), "Despesa excluída") });
  const salvar = async (dados) => {
    const salvo = await executar(() => formulario.id ? api.editarDespesa(Number(formulario.id.slice(4)), dados) : api.criarDespesa(dados), "Despesa salva com sucesso", true);
    if (salvo) setFormulario(null);
  };
  const exportar = () => {
    baixarCsv(`financeiro-${hoje}.csv`, ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"],
      filtrado.map((item) => [formatarData(item.date), item.description, item.category, item.type === "in" ? "Entrada" : "Saída", item.amount.toFixed(2).replace(".", ","), item.status]));
    aviso("Arquivo CSV exportado");
  };
  const definirFiltro = (campo) => (valor) => setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
  const colunas = [
    { key: "date", label: "Data", render: (item) => <span className="whitespace-nowrap text-muted">{formatarData(item.date)}</span> },
    { key: "description", label: "Descrição", render: (item) => <span className="font-medium">{item.description}</span> },
    { key: "category", label: "Categoria" },
    { key: "amount", label: "Valor", render: (item) => <span className={`whitespace-nowrap font-semibold tabular-nums ${item.type === "out" ? "text-danger" : "text-success"}`}>{item.type === "out" ? "− " : "+ "}{formatarMoeda(item.amount)}</span> },
    { key: "status", label: "Status", render: (item) => <SeloStatus status={item.status} /> },
  ];
  if (!permitido) return <EstadoVazio icon="wallet" title="Sem acesso ao Financeiro">Seu perfil não tem permissão para consultar esta tela.</EstadoVazio>;
  if (carregando && !dashboard) return <Cartao className="p-8"><p role="status" className="text-sm text-muted">Carregando resumo e lançamentos financeiros...</p></Cartao>;
  if (!dashboard) return <Cartao className="space-y-4 p-6"><p role="alert" className="text-danger">{erro || "Não foi possível carregar o financeiro."}</p><Botao onClick={atualizar}>Tentar novamente</Botao></Cartao>;
  const resumo = dashboard.resumo;
  const variacao = resumo.variacaoMensal;
  const confirmados = filtrado.filter((item) => item.status === "Pago");
  const bloqueado = ocupado || carregando || !!erro;
  return <div className="min-w-0 space-y-6" aria-busy={carregando}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-bold">Visão geral</h2><p className="mt-1 text-sm text-muted">Acompanhe o caixa e os pagamentos da associação em {ano}.</p></div>
      <Botao disabled={bloqueado} onClick={() => setFormulario({})}><Icone name="plus" size={18} /> Nova despesa</Botao>
    </div>
    {erro && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm"><p>{erro} Os dados abaixo são da última consulta.</p><Botao variant="outline" disabled={carregando} onClick={atualizar}>Tentar novamente</Botao></div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Resumo label="Saldo do mês" value={resumo.saldoMensal} principal detail={variacao == null ? "Sem base de comparação com o mês anterior" : `${variacao > 0 ? "+" : ""}${Number(variacao).toFixed(1).replace(".", ",")}% em relação ao mês anterior`} tone={variacao < 0 ? "text-danger" : "text-muted"} />
      <Resumo label="Saldo do ano" value={resumo.saldoAnual} detail={`Entradas menos saídas confirmadas em ${ano}`} />
      <Resumo label="Entradas no ano" value={resumo.entradasAnuais} detail="Anuidades e mensalidades confirmadas" tone="text-success" />
      <Resumo label="Saídas no ano" value={resumo.saidasAnuais} detail="Despesas com status pago" tone="text-danger" />
    </div>
    <Abas value={aba} onChange={setAba} options={[{ value: "ledger", label: "Lançamentos" }, { value: "payments", label: "Verificar pagamentos" }]} />
    {aba === "payments" ? <PagamentosDER api={api} onChange={atualizar} /> : <>
      <Graficos all={todos} year={String(ano)} />
      <section className="space-y-4" aria-label="Lançamentos financeiros">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Lançamentos</h2><p className="mt-1 text-sm text-muted">Consulte entradas, despesas e seus status.</p></div><Botao variant="outline" disabled={!filtrado.length} onClick={exportar}><Icone name="download" size={18} /> Exportar CSV</Botao></div>
        <Cartao className="space-y-4 p-4 sm:p-5">
          <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
            <div><span className="mb-2 block text-sm font-semibold">Buscar lançamento</span><EntradaBusca value={filtros.q} onChange={definirFiltro("q")} placeholder="Descrição ou categoria" /></div>
            <CampoSelecao label="Período" value={filtros.period} onChange={definirFiltro("period")} options={["Este mês", "Este ano", "Todos"]} />
            <CampoSelecao label="Tipo" value={filtros.type} onChange={definirFiltro("type")} options={[{ value: "Todos", label: "Todos os tipos" }, "Entradas", "Saídas"]} />
            <CampoSelecao label="Status" value={filtros.status} onChange={definirFiltro("status")} options={[{ value: "Todos", label: "Todos os status" }, "Pago", "Pendente", "Recusado"]} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-divider pt-4 text-xs text-muted" aria-live="polite"><span>{filtrado.length} {filtrado.length === 1 ? "lançamento" : "lançamentos"}</span><span>Entradas confirmadas <strong className="text-success">{formatarMoeda(somar(confirmados.filter((item) => item.type === "in")))}</strong></span><span>Saídas pagas <strong className="text-danger">{formatarMoeda(somar(confirmados.filter((item) => item.type === "out")))}</strong></span></div>
        </Cartao>
        <TabelaDados columns={colunas} rows={filtrado} empty={<EstadoVazio icon="wallet" title="Nenhum lançamento encontrado">Ajuste os filtros ou cadastre uma nova despesa.</EstadoVazio>} actions={(item) => item.locked ? <span className="text-xs text-muted">Via pagamento</span> : <>
          {item.status === "Pendente" && <BotaoIcone icon="check" label="Confirmar despesa" size="sm" disabled={bloqueado} onClick={() => executar(() => api.confirmarDespesa(Number(item.id.slice(4))), "Despesa confirmada")} />}
          <BotaoIcone icon="edit" label="Editar despesa" size="sm" disabled={bloqueado} onClick={() => setFormulario(item)} />
          <BotaoIcone icon="trash" label="Excluir despesa" size="sm" tone="danger" disabled={bloqueado} onClick={() => remover(item)} />
        </>} />
      </section>
    </>}
    {formulario && <DespesasForm registro={formulario} onClose={() => setFormulario(null)} onSave={salvar} />}
  </div>;
}
