import { useCallback, useEffect, useMemo, useState } from "react";
import { Botao, CampoSelecao, Modal, Cartao, SeloStatus, EstadoVazio } from "@/components/ui";
import { formatarData, formatarMoeda } from "@/lib/data.js";
const metodos = ["Pix", "Transferência", "Depósito", "Dinheiro", "Boleto", "Cartão"];
export default function MeusPagamentos({ api }) {
const [lista, setLista] = useState([]);
const [erro, setErro] = useState("");
const [carregando, setCarregando] = useState(true);
const [selecionado, setSelecionado] = useState(null);
const [metodo, setMetodo] = useState("Pix");
const [salvando, setSalvando] = useState(false);
const carregar = useCallback(async () => {
setCarregando(true);
try {setLista(await api.minhasCobrancas());setErro("");}
catch(e){setErro(e.message);}finally{setCarregando(false);}
},[api]);
useEffect(() => {carregar();},[carregar]);
const informar = async () => {
if (!selecionado || salvando) return;
setSalvando(true);setErro("");
try {await api.informarPagamento(selecionado.id_pagamento_cobranca,metodo);setSelecionado(null);await carregar();}
catch(e) {setErro(e.message);}finally{setSalvando(false);}
};
const ordenados = useMemo(() => [...lista].sort((a,b)=>b.vencimento.localeCompare(a.vencimento)),[lista]);
return <div className="space-y-5">
<div><h2 className="text-xl font-bold">Meus pagamentos</h2><p className="text-sm text-muted">Consulte suas cobranças e informe
o pagamento para a Diretoria verificar. Não é necessário anexar comprovante.</p></div>
{erro && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{erro}</p>}
{carregando && <p>Carregando seus pagamentos...</p>}
{!carregando && !ordenados.length && <EstadoVazio icon="wallet" title="Nenhuma cobrança pendente" >Não há cobranças destinadas
à sua conta.</EstadoVazio>}
<div className="grid gap-4 md:grid-cols-2">{ordenados.map((p) => <Cartao key={p.id_pagamento_cobranca} className="space-y-4 p-5
">
<div className="flex items-start justify-between gap-2"><div><p className="text-xs text-muted">{p.periodo} · Vence em {formatarData(p.vencimento)}</p><h3 className="mt-1 font-bold">{p.nome_da_cobranca}</h3></div><SeloStatus status={p.status}/></div>
<p className="text-2xl font-bold text-brand">{formatarMoeda(Number(p.valor))}</p>
{p.status === "Pago" ? <p className="text-sm text-success">Pagamento recebido e confirmado pela Diretoria.</p>
: p.status === "Em verificação" ? <p className="text-sm text-muted">Informação enviada. Aguardando conferência da Diretoria.
</p>
: <Botao onClick={() => {setSelecionado(p);setMetodo("Pix");}}>Informar pagamento</Botao>}
</Cartao>)}</div>
{selecionado && <Modal title="Informar pagamento" onClose={()=>!salvando&&setSelecionado(null)}
footer={<><Botao variant="outline" disabled={salvando} onClick={()=>setSelecionado(null)}>Cancelar</Botao>
<Botao disabled={salvando} onClick={informar}>{salvando?"Enviando...":"Enviar para verificação"}</Botao></>}>
<div className="space-y-4"><p className="text-sm">{selecionado.nome_da_cobranca} — <strong>{formatarMoeda(Number(selecionado.
valor))}</strong></p>
<CampoSelecao label="Forma de pagamento" value={metodo} onChange={setMetodo} options={metodos}/>
<p className="text-xs text-muted">Sem anexo: a Diretoria verificará o recebimento antes de registrar como pago.</p></div>
</Modal>}
</div>;
}