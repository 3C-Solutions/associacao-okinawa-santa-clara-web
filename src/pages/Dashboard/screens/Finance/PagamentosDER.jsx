import { useCallback, useEffect, useRef, useState } from "react";
import { Botao, Campo, CampoSelecao, Cartao, SeloStatus, EstadoVazio } from "@/components/ui";
import { hojeISO, METODOS_PAGAMENTO } from "@/lib/data.js";
import CampoFamilia from "./CampoFamilia.jsx";

function ListaPagamentos({ titulo, itens, tipo, ocupado, revisar }) {
  return <Cartao className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-divider p-5"><h3 className="font-bold">{titulo}</h3><span className="text-xs text-muted">{itens.length} registros</span></div>
    {!itens.length ? <EstadoVazio icon="wallet" title="Nenhum pagamento registrado" /> : <div className="divide-y divide-divider">{itens.map((item) => {
      const anuidade = tipo === "anuidade";
      const id = anuidade ? item.idPagamento : item.idPagamentoDepartamento;
      const pendente = item.status?.trim().toLowerCase() === "pendente";
      return <div key={id} className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
        <div className="space-y-1"><p className="font-semibold">{anuidade ? `Família ${item.fkFamilia}` : `Departamento ${item.fkDepartamento}`}</p><p className="text-xs text-muted">{anuidade ? `Anuidade ${item.fkAnuidade}` : `Mensalidade ${item.fkMensalidade}`} · {item.formaPagamento} · Registro #{id}</p></div>
        <div className="flex flex-wrap items-center gap-2"><SeloStatus status={item.status} />{pendente && <><Botao disabled={ocupado} onClick={() => revisar(tipo, item, true)}>Confirmar</Botao><Botao variant="outline" disabled={ocupado} onClick={() => revisar(tipo, item, false)}>Recusar</Botao></>}</div>
      </div>;
    })}</div>}
  </Cartao>;
}

export default function PagamentosDER({ api, onChange }) {
  const [anuidades, setAnuidades] = useState([]);
  const [mensalidades, setMensalidades] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const enviando = useRef(false);
  const [form, setForm] = useState({ tipo: "anuidade", fkFamilia: "", fkAnuidade: "", fkDepartamento: "", fkMensalidade: "", formaPagamento: "Pix" });
  const atualizar = useCallback(async () => {
    setCarregando(true);
    try {
      const [pagamentos, departamentos] = await Promise.all([api.pagamentos(), api.pagamentosDepartamento()]);
      setAnuidades(pagamentos);
      setMensalidades(departamentos);
      setErro("");
    } finally { setCarregando(false); }
  }, [api]);
  useEffect(() => { atualizar().catch((falha) => setErro(falha.message)); }, [atualizar]);
  const executar = async (operacao, criado = false) => {
    if (enviando.current) return;
    enviando.current = true;
    setSalvando(true);
    setErro("");
    try {
      await operacao();
      if (criado) setForm((atual) => ({ ...atual, fkFamilia: "", fkAnuidade: "", fkDepartamento: "", fkMensalidade: "" }));
      onChange();
      try { await atualizar(); }
      catch { setErro("Operação concluída, mas a lista não pôde ser atualizada. Atualize antes de continuar."); }
    } catch (falha) { setErro(falha.message); }
    finally { enviando.current = false; setSalvando(false); }
  };
  const revisar = (tipo, pagamento, aceitar) => executar(() => tipo === "anuidade"
    ? aceitar ? api.confirmarPagamento(pagamento.idPagamento, hojeISO()) : api.recusarPagamento(pagamento.idPagamento)
    : aceitar ? api.confirmarPagamentoDepartamento(pagamento.idPagamentoDepartamento, hojeISO()) : api.recusarPagamentoDepartamento(pagamento.idPagamentoDepartamento));
  const enviar = (evento) => {
    evento.preventDefault();
    const campos = form.tipo === "anuidade" ? ["fkFamilia", "fkAnuidade"] : ["fkDepartamento", "fkMensalidade"];
    if (campos.some((campo) => !/^\d+$/.test(String(form[campo])) || Number(form[campo]) < 1 || Number(form[campo]) > 2147483647)) {
      setErro("Informe códigos inteiros e positivos para os cadastros vinculados."); return;
    }
    executar(() => form.tipo === "anuidade"
      ? api.criarPagamento({ fkFamilia: Number(form.fkFamilia), fkAnuidade: Number(form.fkAnuidade), formaPagamento: form.formaPagamento })
      : api.criarPagamentoDepartamento({ fkDepartamento: Number(form.fkDepartamento), fkMensalidade: Number(form.fkMensalidade), formaPagamento: form.formaPagamento }), true);
  };
  const alterar = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const ocupado = carregando || salvando;
  return <section className="space-y-5" aria-label="Verificação de pagamentos" aria-busy={ocupado}>
    <div><h2 className="text-lg font-bold">Pagamentos da associação</h2><p className="mt-1 text-sm text-muted">Registre pendências e confirme o recebimento de anuidades e mensalidades.</p></div>
    {erro && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-danger-soft p-4 text-sm text-danger"><p>{erro}</p><Botao variant="outline" disabled={ocupado} onClick={() => atualizar().catch((falha) => setErro(falha.message))}>Atualizar lista</Botao></div>}
    {carregando && <p role="status" className="text-sm text-muted">Atualizando pagamentos...</p>}
    <Cartao className="p-5">
      <form onSubmit={enviar} className="space-y-4">
        <div><h3 className="font-bold">Novo pagamento pendente</h3><p className="mt-1 text-xs text-muted">Use os códigos dos cadastros existentes. O valor será obtido da cobrança vinculada.</p></div>
        <fieldset disabled={ocupado} className="grid min-w-0 items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CampoSelecao label="Cobrança" value={form.tipo} onChange={alterar("tipo")} options={[{value:"anuidade",label:"Anuidade da família"},{value:"mensalidade",label:"Mensalidade do departamento"}]} />
          {form.tipo === "anuidade" ? <><CampoFamilia carregar={api.familias} value={form.fkFamilia} onChange={alterar("fkFamilia")} required disabled={ocupado} /><Campo label="Código da anuidade" type="number" min="1" step="1" value={form.fkAnuidade} onChange={alterar("fkAnuidade")} required /></> : <><Campo label="Código do departamento" type="number" min="1" step="1" value={form.fkDepartamento} onChange={alterar("fkDepartamento")} required /><Campo label="Código da mensalidade" type="number" min="1" step="1" value={form.fkMensalidade} onChange={alterar("fkMensalidade")} required /></>}
          <CampoSelecao label="Forma de pagamento" value={form.formaPagamento} onChange={alterar("formaPagamento")} options={METODOS_PAGAMENTO} />
        </fieldset>
        <div className="flex justify-end"><Botao type="submit" disabled={ocupado}>{salvando ? "Processando..." : "Registrar pendência"}</Botao></div>
      </form>
    </Cartao>
    <ListaPagamentos titulo="Anuidades" itens={anuidades} tipo="anuidade" ocupado={ocupado || !!erro} revisar={revisar} />
    <ListaPagamentos titulo="Mensalidades" itens={mensalidades} tipo="mensalidade" ocupado={ocupado || !!erro} revisar={revisar} />
  </section>;
}
