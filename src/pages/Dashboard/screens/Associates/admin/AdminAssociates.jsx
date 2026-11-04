import { useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoUsuarios } from "@/services/usuarios.js";
import { baixarCsv, hojeISO, mascararTelefone } from "@/lib/data.js";
import { Selo, Botao, TabelaDados, EstadoVazio, Icone, BotaoIcone, EntradaBusca, CampoSelecao, Cartao } from "@/components/ui";
import DetalhesUsuario from "./UserDetails.jsx";
import FormularioEdicaoUsuario from "./UserEditForm.jsx";
import FormularioCadastroUsuario from "./UserCreateForm.jsx";
import ConfirmacaoExclusaoUsuario from "./UserDeleteConfirm.jsx";

export default function AssociadosAdmin() {
  const { usuario: autenticado, requisitar, atualizarContexto, podeAcessar } = usarAutenticacao();
  const servico = useMemo(() => criarServicoUsuarios(requisitar), [requisitar]);
  const recurso = usarRecursoApi(servico.listar);
  const usuarios = recurso.dados || [];
  const [consulta, definirConsulta] = useState("");
  const [filtroPapel, definirFiltroPapel] = useState("");
  const [editando, definirEditando] = useState(null);
  const [visualizando, definirVisualizando] = useState(null);
  const [mensagem, definirMensagem] = useState(null);
  const [cadastrando, definirCadastrando] = useState(false);
  const [excluindo, definirExcluindo] = useState(null);

  const funcoes = useMemo(() => {
    const grupos = new Map();
    usuarios.forEach((usuario) => {
      const chave = usuario.funcaoId === null ? "sem-funcao" : String(usuario.funcaoId);
      const funcao = grupos.get(chave) || { value: chave, nome: usuario.role, quantidade: 0 };
      funcao.quantidade += 1;
      grupos.set(chave, funcao);
    });
    return [...grupos.values()].sort((a, b) => a.nome.localeCompare(b.nome)).map((funcao) => ({ value: funcao.value, label: `${funcao.nome} (${funcao.quantidade})` }));
  }, [usuarios]);
  // Uma função removida da lista não deixa um filtro invisível prendendo a consulta.
  const filtroAtivo = funcoes.some((funcao) => funcao.value === filtroPapel) ? filtroPapel : "";
  const linhas = useMemo(() => {
    const termo = consulta.trim().toLocaleLowerCase("pt-BR");
    return usuarios
      .filter((usuario) => !filtroAtivo || (usuario.funcaoId === null ? "sem-funcao" : String(usuario.funcaoId)) === filtroAtivo)
      .filter((usuario) => !termo || `${usuario.name} ${usuario.email} ${usuario.phone} ${usuario.role} ${usuario.note}`.toLocaleLowerCase("pt-BR").includes(termo))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [usuarios, consulta, filtroAtivo]);

  const salvar = async (usuario, formulario, alterarFuncao, signal) => {
    const atualizado = await servico.atualizar(usuario, formulario, alterarFuncao && podeAcessar("TELA_USUARIOS"), signal);
    if (signal.aborted) return;
    recurso.atualizarDados((lista) => (lista || []).map((item) => item.id === atualizado.id ? atualizado : item));
    definirEditando(null);
    definirMensagem("Usuário atualizado com sucesso.");
    if (atualizado.id === autenticado.id) await atualizarContexto({ forcar: true });
  };

  const cadastrar = async (formulario, signal) => {
    const novo = await servico.cadastrar(formulario, signal);
    if (signal.aborted) return;
    recurso.atualizarDados((lista) => [...(lista || []).filter((item) => item.id !== novo.id), novo]);
    definirCadastrando(false);
    definirMensagem(`Usuário ${novo.name} cadastrado. A senha provisória foi enviada para ${novo.email}.`);
  };

  const excluir = async (usuario, signal) => {
    await servico.excluir(usuario.id, signal);
    if (signal.aborted) return;
    recurso.atualizarDados((lista) => (lista || []).map((item) => item.id === usuario.id ? { ...item, ativo: false } : item));
    definirExcluindo(null);
    definirMensagem(`Usuário ${usuario.name} excluído (inativado).`);
  };

  const exportarCsv = () => {
    const celula = (valor) => /^[\s]*[=+\-@]/.test(String(valor || "")) ? `'${valor}` : valor;
    baixarCsv(`usuarios-${hojeISO()}.csv`, ["Nome", "Função", "E-mail", "Telefone", "Família", "Vínculo", "Departamentos", "Situação"],
      linhas.map((usuario) => [usuario.name, usuario.role, usuario.email, usuario.phone, usuario.family, usuario.note, "Não disponível", usuario.ativo ? "Ativo" : "Inativo"].map(celula)));
    definirMensagem("Arquivo CSV gerado com os usuários filtrados.");
  };
  const colunas = [
    { key: "name", label: "Nome", render: (usuario) => <><span className="block font-semibold">{usuario.name}</span><span className="block text-xs text-muted">{usuario.email}</span></> },
    { key: "role", label: "Função", render: (usuario) => <div className="flex flex-col items-start gap-1"><Selo tone="info">{usuario.role}</Selo><Selo tone={usuario.ativo ? "success" : "danger"}>{usuario.ativo ? "Ativo" : "Inativo"}</Selo></div> },
    { key: "note", label: "Vínculo", render: (usuario) => <span className="text-muted">{usuario.note}</span> },
    { key: "phone", label: "Telefone", render: (usuario) => {
      const telefone = usuario.phone || "";
      const digitos = telefone.replace(/\D/g, "");
      return [10, 11].includes(digitos.length) ? mascararTelefone(telefone) : telefone || "—";
    } },
    { key: "departments", label: "Departamentos", render: () => <span className="text-muted">Não disponível</span> },
  ];

  return (
    <div className="space-y-6" aria-busy={recurso.carregando}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <EntradaBusca value={consulta} onChange={definirConsulta} placeholder="Buscar por nome" className="flex-1 sm:max-w-md" />
          <CampoSelecao label="" value={filtroAtivo} onChange={definirFiltroPapel} placeholder="Todas as funções" options={funcoes} disabled={recurso.carregando} className="sm:w-60 [&>span:first-child]:hidden" />
          <CampoSelecao label="" value="" placeholder="Departamentos indisponíveis" options={[]} disabled className="sm:w-60 [&>span:first-child]:hidden" />
        </div>
        <div className="flex gap-2">
          <Botao variant="outline" onClick={exportarCsv} disabled={!linhas.length || recurso.carregando || !!recurso.erro}><Icone name="download" size={18} /> Exportar</Botao>
          <Botao onClick={() => { definirMensagem(null); definirCadastrando(true); }} disabled={recurso.carregando || !!recurso.erro}><Icone name="plus" size={18} /> Novo usuário</Botao>
        </div>
      </div>
      <p className="text-sm text-muted">Vínculos com departamentos estarão disponíveis em uma próxima etapa.</p>
      {mensagem && <p role="status" className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">{mensagem}</p>}
      {recurso.carregando ? <Cartao className="p-8"><p role="status" className="text-center text-muted">Carregando usuários...</p></Cartao> : recurso.erro ? (
        <Cartao className="space-y-4 p-6"><p role="alert" className="text-sm text-danger">{recurso.erro}</p><Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao></Cartao>
      ) : (
        <>
          <p className="text-sm text-muted">{linhas.length} {linhas.length === 1 ? "usuário encontrado" : "usuários encontrados"}.</p>
          <TabelaDados columns={colunas} rows={linhas}
            empty={<EstadoVazio icon="person" title="Nenhum usuário encontrado">{usuarios.length ? "Ajuste a busca ou os filtros." : "Não há usuários cadastrados para exibir."}</EstadoVazio>}
            actions={(usuario) => <>
              <BotaoIcone icon="eye" label={`Ver detalhes de ${usuario.name}`} size="sm" onClick={() => { definirMensagem(null); definirVisualizando(usuario); }} />
              <BotaoIcone icon="edit" label={`Editar ${usuario.name}`} size="sm" onClick={() => { definirMensagem(null); definirEditando(usuario.id); }} />
              <BotaoIcone icon="trash" label={usuario.id === autenticado.id ? "Não é possível excluir a própria conta" : !usuario.ativo ? `${usuario.name} já está inativo` : `Excluir ${usuario.name}`} tone="danger" size="sm" disabled={usuario.id === autenticado.id || !usuario.ativo} onClick={() => { definirMensagem(null); definirExcluindo(usuario); }} />
            </>}
          />
        </>
      )}
      {visualizando && <DetalhesUsuario key={visualizando.id} user={visualizando} service={servico} onClose={() => definirVisualizando(null)} onEdit={(usuario) => { definirVisualizando(null); definirEditando(usuario.id); }} />}
      {cadastrando && <FormularioCadastroUsuario onClose={() => definirCadastrando(false)} onSave={cadastrar} />}
      {excluindo && <ConfirmacaoExclusaoUsuario key={excluindo.id} user={excluindo} onClose={() => definirExcluindo(null)} onConfirm={excluir} />}
      {editando !== null && <FormularioEdicaoUsuario key={editando} userId={editando} service={servico} onClose={() => definirEditando(null)} onSave={salvar} />}
    </div>
  );
}
