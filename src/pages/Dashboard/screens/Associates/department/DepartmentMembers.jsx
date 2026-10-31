import { useState } from "react";
import { baixarCsv, formatarData } from "@/lib/data.js";
import { capacidadeDe, matricularPessoa, estaCompleto, membrosDe, abrirSolicitacao, solicitacoesDe, desmatricularPessoa } from "@/lib/people.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Botao, Cartao, TabelaDados, EstadoVazio, Icone, BotaoIcone, CabecalhoPagina, EntradaBusca, SeloStatus, Abas } from "@/components/ui";
import ModalAdicionarMembro from "./AddMemberModal.jsx";

// ---------- Departamento ----------
// Único perfil que adiciona/remove inscritos: aprova solicitações, coloca em lista de espera ou adiciona pela lista completa.
export default function MembrosDepartamento({ account: conta }) {
  const { state: dadosAplicacao, save: salvar, notify: notificar, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const [consulta, definirConsulta] = useState("");
  const [aba, definirAba] = useState("enrolled");
  const [adicionando, definirAdicionando] = useState(false);
  const departamento = usuario.department;
  if (!departamento) return <Cartao><EstadoVazio icon="groups" title="Departamento não encontrado" /></Cartao>;

  const membros = membrosDe(dadosAplicacao, departamento.id);
  const linhas = membros.filter((mes) => `${mes.name} ${mes.associateName}`.toLowerCase().includes(consulta.trim().toLowerCase()));
  const pendente = solicitacoesDe(dadosAplicacao, departamento.id, "Pendente");
  const listaEspera = solicitacoesDe(dadosAplicacao, departamento.id, "Lista de espera");
  const limite = capacidadeDe(departamento);
  const completo = estaCompleto(dadosAplicacao, departamento);
  const telefoneDe = (identificador) => dadosAplicacao.associates.find((elementoA) => elementoA.id === identificador)?.phone || "";
  const desde = (identificador) => dadosAplicacao.associates.find((elementoA) => elementoA.id === identificador)?.since || "";
  const correspondencias = (resultado) => `${resultado.personName} ${resultado.associateName}`.toLowerCase().includes(consulta.trim().toLowerCase());

  const notificarMembro = (identificadorAssociado, titulo, detalhe) => notificar("member", titulo, detalhe, "department", { associateId: identificadorAssociado });
  const matricular = (identificadorAssociado, identificadorPessoa) => {
    const elementoA = dadosAplicacao.associates.find((valorX) => valorX.id === identificadorAssociado);
    if (elementoA) salvar("associates", matricularPessoa(elementoA, identificadorPessoa, departamento.id));
  };

  const aprovar = (resultado) => {
    if (completo) { aviso("Departamento lotado. Aumente o limite ou remova um inscrito antes de aprovar.", "error"); return; }
    matricular(resultado.associateId, resultado.personId);
    salvar("enrollmentRequests", { ...resultado, status: "Aprovada" });
    notificarMembro(resultado.associateId, "Inscrição aprovada", `${resultado.personName} foi inscrito(a) em ${departamento.name}.`);
    aviso(`${resultado.personName} inscrito(a)`);
  };
  const adicionarAListaEspera = (resultado) => { salvar("enrollmentRequests", { ...resultado, status: "Lista de espera" }); notificarMembro(resultado.associateId, "Lista de espera", `${resultado.personName} entrou na lista de espera de ${departamento.name}.`); aviso("Colocado em lista de espera"); };
  const rejeitar = (resultado) => confirmar({ title: "Recusar solicitação", message: `Recusar a solicitação de ${resultado.personName}?`, confirmLabel: "Recusar", onConfirm: () => { salvar("enrollmentRequests", { ...resultado, status: "Recusada" }); notificarMembro(resultado.associateId, "Solicitação recusada", `A solicitação de ${resultado.personName} em ${departamento.name} não foi aprovada.`); aviso("Solicitação recusada"); } });
  const adicionarDiretamente = (parametro) => {
    if (completo) { aviso("Departamento lotado.", "error"); return; }
    matricular(parametro.associateId, parametro.id);
    const abrir = abrirSolicitacao(dadosAplicacao, departamento.id, parametro.id);
    if (abrir) salvar("enrollmentRequests", { ...abrir, status: "Aprovada" });
    notificarMembro(parametro.associateId, "Inscrição realizada", `${parametro.name} foi inscrito(a) em ${departamento.name}.`);
    aviso(`${parametro.name} adicionado(a)`);
  };
  const removerMembro = (mes) => confirmar({ title: "Remover inscrito", message: `Remover ${mes.name} de ${departamento.name}?`, confirmLabel: "Remover", onConfirm: () => {
    const elementoA = dadosAplicacao.associates.find((valorX) => valorX.id === mes.associateId);
    if (elementoA) salvar("associates", desmatricularPessoa(elementoA, mes.id, departamento.id));
    notificarMembro(mes.associateId, "Inscrição encerrada", `${mes.name} foi removido(a) de ${departamento.name}.`);
    aviso("Inscrito removido");
  } });

  const exportarCsv = () => { baixarCsv(`inscritos-${departamento.name}.csv`, ["Nome", "Vínculo", "Responsável", "Telefone"], linhas.map((mes) => [mes.name, mes.relation, mes.associateName, telefoneDe(mes.associateId)])); aviso("Arquivo CSV gerado"); };

  const colunasMembros = [
    { key: "name", label: "Inscrito", render: (mes) => <span className="font-semibold">{mes.name}</span> },
    { key: "relation", label: "Vínculo", render: (mes) => (mes.main ? "Responsável" : `${mes.relation} de ${mes.associateName}`) },
    { key: "phone", label: "Telefone", render: (mes) => telefoneDe(mes.associateId) },
    { key: "since", label: "Associado desde", render: (mes) => formatarData(desde(mes.associateId)) },
  ];
  const colunasSolicitacoes = [
    { key: "personName", label: "Solicitante", render: (resultado) => <span className="font-semibold">{resultado.personName}</span> },
    { key: "relation", label: "Vínculo", render: (resultado) => (resultado.relation === "Responsável" ? "Responsável" : `${resultado.relation} de ${resultado.associateName}`) },
    { key: "createdAt", label: "Solicitado em", render: (resultado) => formatarData(resultado.createdAt.slice(0, 10)) },
    { key: "status", label: "Situação", render: (resultado) => <SeloStatus status={resultado.status} /> },
  ];
  const acoesSolicitacao = (resultado) => (
    <>
      <Botao className="min-h-9 px-3 text-sm" onClick={() => aprovar(resultado)}><Icone name="check" size={16} /> Aprovar</Botao>
      {resultado.status === "Pendente" && <Botao variant="secondary" className="min-h-9 px-3 text-sm" onClick={() => adicionarAListaEspera(resultado)}><Icone name="clock" size={16} /> Lista de espera</Botao>}
      <BotaoIcone icon="close" label="Recusar" tone="danger" size="sm" onClick={() => rejeitar(resultado)} />
    </>
  );

  return (
    <div className="space-y-6">
      <CabecalhoPagina left={<EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar por nome" className="max-w-md" />}>
        <Botao variant="outline" onClick={exportarCsv} disabled={!linhas.length}><Icone name="download" size={18} /> Exportar</Botao>
        <Botao onClick={() => definirAdicionando(true)}><Icone name="plus" size={18} /> Adicionar associado</Botao>
      </CabecalhoPagina>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Abas value={aba} onChange={definirAba} options={[{ value: "enrolled", label: `Inscritos (${membros.length})` }, { value: "requests", label: `Solicitações (${pendente.length})` }, { value: "waitlist", label: `Lista de espera (${listaEspera.length})` }]} />
        <p className="text-sm text-muted">{limite ? <>Vagas: <strong className={completo ? "text-danger" : "text-brand"}>{membros.length} de {limite}</strong> preenchidas{completo ? " — departamento lotado" : ""}</> : `${membros.length} inscritos · sem limite definido`}</p>
      </div>
      {aba === "enrolled" && <TabelaDados columns={colunasMembros} rows={linhas} empty={<EstadoVazio icon="person" title="Nenhum inscrito encontrado" />} actions={(mes) => <BotaoIcone icon="trash" label="Remover do departamento" tone="danger" size="sm" onClick={() => removerMembro(mes)} />} />}
      {aba === "requests" && <TabelaDados columns={colunasSolicitacoes} rows={pendente.filter(correspondencias)} empty={<EstadoVazio icon="clock" title="Nenhuma solicitação pendente">Quando um associado solicitar inscrição, ela aparecerá aqui para você aprovar ou colocar em lista de espera.</EstadoVazio>} actions={acoesSolicitacao} />}
      {aba === "waitlist" && <TabelaDados columns={colunasSolicitacoes} rows={listaEspera.filter(correspondencias)} empty={<EstadoVazio icon="clock" title="Lista de espera vazia" />} actions={acoesSolicitacao} />}
      {adicionando && <ModalAdicionarMembro department={departamento} onClose={() => definirAdicionando(false)} onAdd={adicionarDiretamente} />}
    </div>
  );
}
