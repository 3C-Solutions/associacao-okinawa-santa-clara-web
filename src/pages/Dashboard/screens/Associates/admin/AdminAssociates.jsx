import { useMemo, useState } from "react";
import { SENHA_INICIAL, TIPOS_USUARIOS, baixarCsv, hojeISO, identificadorUnico } from "@/lib/data.js";
import { rotuloFamilia, familiaDe } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Selo, Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca, CampoSelecao } from "@/components/ui";
import { nomesDepartamentos } from "../helpers.js";
import DetalhesAssociado from "./AssociateDetails.jsx";
import FormularioUsuario from "./UserForm.jsx";

// ---------- Diretoria ----------
// Lista todos os usuários do sistema e cadastra UM usuário por vez, escolhendo o tipo de perfil.
const TONS_PAPEIS = { Diretoria: "danger", Departamento: "warning", "Associado responsável": "success", Dependente: "info" };
const ORDEM_TIPOS = TIPOS_USUARIOS.map((tempo) => tempo.value);

export default function AssociadosAdmin({ account: conta, navigate: navegar }) {
  const { state: dadosAplicacao, save: salvar, remove: remover, removeWhere: removerOnde, addAccount: adicionarConta, updateAccounts: atualizarContas, removeAccounts: removerContas, toast: aviso, confirm: confirmar } = usarArmazenamento();
  const [consulta, definirConsulta] = useState("");
  const [departamento, definirDepto] = useState("");
  const [filtroPapel, definirFiltroPapel] = useState("");
  const [formulario, definirFormulario] = useState(null); // { user } — user = null cadastra um novo usuário
  const [visualizando, definirVisualizando] = useState(null);

  const usuarios = useMemo(() => {
    const lista = [];
    Object.entries(dadosAplicacao.profiles).forEach(([chave, parametro]) => {
      if (parametro.role === "admin") lista.push({ id: chave, type: "admin", name: parametro.name, email: parametro.email, phone: parametro.phone, departmentIds: [], note: "Diretoria da associação" });
      if (parametro.role === "department") lista.push({ id: chave, type: "department", name: parametro.name, email: parametro.email, phone: parametro.phone, departmentIds: parametro.departmentId ? [parametro.departmentId] : [], note: "Responsável pelo departamento" });
    });
    dadosAplicacao.associates.forEach((elementoA) => {
      const familia = familiaDe(dadosAplicacao, elementoA);
      lista.push({ id: elementoA.id, type: "member", name: elementoA.name, email: elementoA.email, phone: elementoA.phone, departmentIds: elementoA.departmentIds, associate: elementoA, family: rotuloFamilia(familia), note: `${rotuloFamilia(familia)} · ${elementoA.dependents.length} dependente(s)` });
      elementoA.dependents.forEach((parametro) => lista.push({ id: parametro.id, type: "dependent", name: parametro.name, email: parametro.email || "", phone: parametro.phone || elementoA.phone, departmentIds: parametro.departmentIds, associate: elementoA, person: parametro, family: rotuloFamilia(familia), note: `${parametro.relation} de ${elementoA.name} · ${rotuloFamilia(familia)}` }));
    });
    return lista.map((usuarioAtual) => ({ ...usuarioAtual, role: TIPOS_USUARIOS.find((tempo) => tempo.value === usuarioAtual.type).label }));
  }, [dadosAplicacao]);

  const linhas = useMemo(() => {
    const termo = consulta.trim().toLowerCase();
    return usuarios
      .filter((usuarioAtual) => !filtroPapel || usuarioAtual.type === filtroPapel)
      .filter((usuarioAtual) => !departamento || usuarioAtual.departmentIds.includes(departamento))
      .filter((usuarioAtual) => !termo || `${usuarioAtual.name} ${usuarioAtual.email} ${usuarioAtual.phone} ${usuarioAtual.note}`.toLowerCase().includes(termo))
      .sort((elementoA, elementoB) => ORDEM_TIPOS.indexOf(elementoA.type) - ORDEM_TIPOS.indexOf(elementoB.type) || elementoA.name.localeCompare(elementoB.name));
  }, [usuarios, consulta, departamento, filtroPapel]);

  // ---------- cadastro (um usuário por vez) ----------
  const criar = (elementoF) => {
    const base = { name: elementoF.name, email: elementoF.email, phone: elementoF.phone };
    if (elementoF.type === "admin") {
      adicionarConta(`u-${identificadorUnico()}`, { role: "admin", ...base, emailNotifications: true }, SENHA_INICIAL);
    } else {
      const identificador = `a-${identificadorUnico()}`;
      salvar("associates", { id: identificador, familyId: elementoF.familyId, ...base, since: elementoF.since, departmentIds: [], dependents: [] });
      adicionarConta(`u-${identificador}`, { role: "member", ...base, associateId: identificador, emailNotifications: true }, SENHA_INICIAL);
    }
    aviso(`${TIPOS_USUARIOS.find((tempo) => tempo.value === elementoF.type).label} cadastrado(a). Senha inicial: ${SENHA_INICIAL}.`);
  };

  const atualizar = (elementoF, usuarioAtual) => {
    const base = { name: elementoF.name, email: elementoF.email, phone: elementoF.phone };
    if (usuarioAtual.type === "admin" || usuarioAtual.type === "department") {
      atualizarContas((ignorado, chave) => chave === usuarioAtual.id, { ...base, ...(usuarioAtual.type === "department" ? { departmentId: elementoF.departmentId } : {}) });
    } else if (usuarioAtual.type === "member") {
      salvar("associates", { ...usuarioAtual.associate, ...base, familyId: elementoF.familyId, since: elementoF.since });
      atualizarContas((parametro) => parametro.role === "member" && parametro.associateId === usuarioAtual.associate.id, base);
    } else {
      salvar("associates", { ...usuarioAtual.associate, dependents: usuarioAtual.associate.dependents.map((parametro) => (parametro.id === usuarioAtual.id ? { ...parametro, ...base, relation: elementoF.relation } : parametro)) });
      atualizarContas((parametro) => parametro.personId === usuarioAtual.id, base);
    }
    aviso("Usuário atualizado");
  };

  const enviar = (elementoF) => { if (formulario.user) atualizar(elementoF, formulario.user); else criar(elementoF); definirFormulario(null); };

  // ---------- exclusão ----------
  const excluir = (usuarioAtual) => {
    if (usuarioAtual.type === "admin" && Object.values(dadosAplicacao.profiles).filter((parametro) => parametro.role === "admin").length <= 1) { aviso("Mantenha ao menos um usuário da Diretoria.", "error"); return; }
    const mensagens = {
      admin: `Excluir ${usuarioAtual.name}? Ele(a) perderá o acesso à Diretoria.`,
      department: `Excluir ${usuarioAtual.name}? Ele(a) perderá o acesso ao departamento.`,
      member: `Excluir ${usuarioAtual.name} e seus ${usuarioAtual.associate?.dependents.length} dependente(s)? Essa ação não pode ser desfeita.`,
      dependent: `Excluir ${usuarioAtual.name}? As inscrições em departamentos também serão removidas.`,
    };
    confirmar({
      title: "Excluir usuário",
      message: mensagens[usuarioAtual.type],
      onConfirm: () => {
        if (usuarioAtual.type === "member") remover("associates", usuarioAtual.associate.id);
        else if (usuarioAtual.type === "dependent") {
          salvar("associates", { ...usuarioAtual.associate, dependents: usuarioAtual.associate.dependents.filter((parametro) => parametro.id !== usuarioAtual.id) });
          removerOnde("enrollmentRequests", (resultado) => resultado.personId === usuarioAtual.id);
          removerContas((parametro) => parametro.personId === usuarioAtual.id);
        } else removerContas((ignorado, chave) => chave === usuarioAtual.id);
        aviso("Usuário excluído");
      },
    });
  };

  const exportarCsv = () => { baixarCsv(`usuarios-${hojeISO()}.csv`, ["Nome", "Função", "E-mail", "Telefone", "Família", "Vínculo", "Departamentos"], linhas.map((usuarioAtual) => [usuarioAtual.name, usuarioAtual.role, usuarioAtual.email, usuarioAtual.phone, usuarioAtual.family || "", usuarioAtual.note, nomesDepartamentos(dadosAplicacao, usuarioAtual.departmentIds).join(", ")])); aviso("Arquivo CSV gerado"); };

  const colunas = [
    { key: "name", label: "Nome", render: (usuarioAtual) => <span className="font-semibold">{usuarioAtual.name}</span> },
    { key: "role", label: "Função", render: (usuarioAtual) => <Selo tone={TONS_PAPEIS[usuarioAtual.role]}>{usuarioAtual.role}</Selo> },
    { key: "note", label: "Vínculo", render: (usuarioAtual) => <span className="text-muted">{usuarioAtual.note}</span> },
    { key: "phone", label: "Telefone" },
    { key: "departments", label: "Departamentos", render: (usuarioAtual) => <span className="text-muted">{nomesDepartamentos(dadosAplicacao, usuarioAtual.departmentIds).join(", ") || "—"}</span> },
  ];
  const quantidades = (tipo) => usuarios.filter((usuarioAtual) => usuarioAtual.type === tipo).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar por nome" className="flex-1 sm:max-w-md" />
          <CampoSelecao label="" value={filtroPapel} onChange={definirFiltroPapel} placeholder="Todas as funções" options={TIPOS_USUARIOS.map((tempo) => ({ value: tempo.value, label: `${tempo.label} (${quantidades(tempo.value)})` }))} className="sm:w-60 [&>span:first-child]:hidden" />
          <CampoSelecao label="" value={departamento} onChange={definirDepto} placeholder="Todos os departamentos" options={dadosAplicacao.departments.map((dataValor) => ({ value: dataValor.id, label: dataValor.name }))} className="sm:w-60 [&>span:first-child]:hidden" />
        </div>
        <div className="flex gap-2">
          <Botao variant="outline" onClick={exportarCsv} disabled={!linhas.length}><Icone name="download" size={18} /> Exportar</Botao>
          <Botao onClick={() => definirFormulario({ user: null })}><Icone name="plus" size={18} /> Novo usuário</Botao>
        </div>
      </div>
      <p className="text-sm text-muted">{linhas.length} {linhas.length === 1 ? "usuário encontrado" : "usuários encontrados"}.</p>
      <TabelaDados
        columns={colunas}
        rows={linhas}
        empty={<EstadoVazio icon="person" title="Nenhum usuário encontrado">Ajuste a busca ou os filtros, ou cadastre um novo usuário.</EstadoVazio>}
        actions={(usuarioAtual) => (usuarioAtual.id === conta
          ? <span className="text-xs text-muted">Em Configurações</span>
          : (<>
              {usuarioAtual.associate && <BotaoIcone icon="eye" label={usuarioAtual.type === "member" ? `Ver detalhes de ${usuarioAtual.name}` : `Ver família de ${usuarioAtual.name}`} size="sm" onClick={() => definirVisualizando(usuarioAtual.associate)} />}
              <BotaoIcone icon="edit" label={`Editar ${usuarioAtual.name}`} size="sm" onClick={() => definirFormulario({ user: usuarioAtual })} />
              <BotaoIcone icon="trash" label={`Excluir ${usuarioAtual.name}`} tone="danger" size="sm" onClick={() => excluir(usuarioAtual)} />
            </>))}
      />
      {formulario && <FormularioUsuario user={formulario.user} onClose={() => definirFormulario(null)} onSave={enviar} onGoToFamilies={() => { definirFormulario(null); navegar?.("families"); }} />}
      {visualizando && <DetalhesAssociado associate={dadosAplicacao.associates.find((elementoA) => elementoA.id === visualizando.id) || visualizando} onClose={() => definirVisualizando(null)} onEdit={() => { definirFormulario({ user: usuarios.find((usuarioAtual) => usuarioAtual.id === visualizando.id) }); definirVisualizando(null); }} />}
    </div>
  );
}
