import { useCallback, useEffect, useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Campo, CampoAreaTexto, Cartao, EstadoVazio, SeloStatus, TabelaDados } from "@/components/ui";
import { formatarData, formatarMoeda } from "@/lib/data.js";
import CampoComprovante from "@/pages/Dashboard/components/ReceiptField.jsx";
import { usarArmazenamento } from "@/store";
import { criarServicoReembolsos } from "@/services/reembolsosApi.js";
import { validarReembolso } from "./refundHelpers.js";

const formularioInicial = { reason: "", amount: "", receipt: null };

export default function SolicitacoesReembolso() {
  const { requisitar } = usarAutenticacao();
  const { toast: aviso } = usarArmazenamento();
  const api = useMemo(() => criarServicoReembolsos(requisitar), [requisitar]);
  const [itens, definirItens] = useState([]);
  const [formulario, definirFormulario] = useState(formularioInicial);
  const [erros, definirErros] = useState({});
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const [erro, definirErro] = useState("");

  const carregar = useCallback(async (signal) => {
    const resultado = await api.meus({ signal });
    if (!Array.isArray(resultado)) throw new Error("O serviço retornou uma lista de reembolsos inválida.");
    definirItens(resultado);
    definirErro("");
  }, [api]);

  useEffect(() => {
    const controle = new AbortController();
    definirCarregando(true);
    carregar(controle.signal)
      .catch((falha) => { if (!controle.signal.aborted) setErro(falha.message); })
      .finally(() => { if (!controle.signal.aborted) definirCarregando(false); });
    return () => controle.abort();
  }, [carregar]);

  const definir = (campo) => (valor) => {
    definirFormulario((atual) => ({ ...atual, [campo]: valor }));
    definirErros((atual) => ({ ...atual, [campo]: undefined }));
    definirErro("");
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    const resultado = validarReembolso(formulario);
    definirErros(resultado.erros);
    if (Object.keys(resultado.erros).length) return;

    setSalvando(true);
    definirErro("");
    try {
      await api.criar({
        motivo: formulario.reason.trim(),
        valor: resultado.valor,
        comprovante: {
          nome: formulario.receipt.name,
          tipo: formulario.receipt.type,
          dados: formulario.receipt.data,
        },
      });
      definirFormulario(formularioInicial);
      definirErros({});
      aviso("Solicitação enviada ao Financeiro");
      try {
        await carregar();
      } catch (falha) {
        definirErro(`Solicitação enviada, mas a lista não pôde ser atualizada: ${falha.message}`);
      }
    } catch (falha) {
      definirErro(falha.message);
    } finally {
      setSalvando(false);
    }
  };

  const colunas = [
    { key: "dataSolicitacao", label: "Solicitado em", render: (item) => formatarData(item.dataSolicitacao.slice(0, 10)) },
    { key: "motivo", label: "Motivo", render: (item) => <span className="font-medium">{item.motivo}</span> },
    { key: "valor", label: "Valor", render: (item) => <span className="whitespace-nowrap font-semibold">{formatarMoeda(item.valor)}</span> },
    { key: "status", label: "Status", render: (item) => <div className="space-y-1"><SeloStatus status={item.status} />{item.status === "Aprovado" && <p className="text-xs text-muted">Aguardando pagamento</p>}</div> },
  ];

  return <section className="space-y-5" aria-label="Solicitações de reembolso">
    <div>
      <h2 className="text-lg font-bold">Solicitar reembolso</h2>
      <p className="mt-1 text-sm text-muted">Envie a solicitação para análise do Financeiro e acompanhe o andamento aqui.</p>
    </div>
    <Cartao className="space-y-4 p-5">
      <form onSubmit={enviar} className="space-y-4">
        <CampoAreaTexto label="Motivo" rows={3} value={formulario.reason} onChange={definir("reason")} error={erros.reason} placeholder="Descreva a despesa que deve ser reembolsada" required maxLength={500} />
        <Campo label="Valor (R$)" type="number" min="0.01" step="0.01" value={formulario.amount} onChange={definir("amount")} error={erros.amount} required />
        <CampoComprovante value={formulario.receipt} onChange={definir("receipt")} error={erros.receipt} />
        <div className="flex justify-end"><Botao type="submit" disabled={salvando || carregando}>{salvando ? "Enviando..." : "Enviar solicitação"}</Botao></div>
      </form>
    </Cartao>
    {erro && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{erro}</p>}
    <div>
      <h3 className="text-lg font-bold">Minhas solicitações</h3>
      <p className="mt-1 text-sm text-muted">Uma solicitação aprovada entra no Financeiro como despesa pendente até o pagamento.</p>
    </div>
    {carregando ? <p role="status" className="text-sm text-muted">Carregando solicitações...</p> : <TabelaDados
      columns={colunas}
      rows={itens}
      empty={<EstadoVazio icon="wallet" title="Nenhuma solicitação enviada">Depois de enviar um pedido, você poderá acompanhar o status por aqui.</EstadoVazio>}
      actions={(item) => item.status === "Recusado" && item.motivoRecusa
        ? <span className="max-w-xs text-xs text-danger">{item.motivoRecusa}</span>
        : <span className="text-xs text-muted">{item.status === "Pago" ? "Reembolso pago" : item.status === "Aprovado" ? "Aguardando pagamento" : "Em análise"}</span>}
    />}
  </section>;
}
