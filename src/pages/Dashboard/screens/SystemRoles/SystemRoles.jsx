import { useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoFuncoesSistema } from "@/services/funcoesSistema.js";
import { Botao, Cartao, EntradaBusca, EstadoVazio, Icone, TabelaDados } from "@/components/ui";
import FormularioFuncaoSistema from "./SystemRoleForm.jsx";
import FormularioAcessosFuncao from "./SystemRoleAccessForm.jsx";

const colunas = [
  { key: "nome", label: "Nome", render: (funcao) => <span className="font-semibold">{funcao.nome}</span> },
  { key: "descricao", label: "Descrição", render: (funcao) => <span className="whitespace-pre-wrap break-words text-muted">{funcao.descricao.trim() || "Não informada"}</span> },
];

export function ConteudoFuncoesSistema({ recurso, consulta, aoBuscar, aoCadastrar, aoEditarAcessos, mensagem }) {
  const funcoes = recurso.dados || [];
  const termo = consulta.trim().toLocaleLowerCase("pt-BR");
  const linhas = funcoes.filter((funcao) => !termo || `${funcao.nome} ${funcao.descricao}`.toLocaleLowerCase("pt-BR").includes(termo));

  return (
    <div className="space-y-6" aria-busy={recurso.carregando}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <EntradaBusca value={consulta} onChange={aoBuscar} placeholder="Buscar por nome ou descrição" className="flex-1 sm:max-w-md" />
        {aoCadastrar && <Botao onClick={aoCadastrar}><Icone name="plus" size={18} /> Nova função</Botao>}
      </div>
      {mensagem && <p role="status" className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">{mensagem}</p>}
      {recurso.carregando ? (
        <Cartao className="p-8"><p role="status" className="text-center text-muted">Carregando funções do sistema...</p></Cartao>
      ) : recurso.erro ? (
        <Cartao className="space-y-4 p-6">
          <p role="alert" className="text-sm text-danger">{recurso.erro}</p>
          <Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao>
        </Cartao>
      ) : (
        <>
          <p role="status" className="text-sm text-muted">{linhas.length} {linhas.length === 1 ? "função encontrada" : "funções encontradas"}.</p>
          <TabelaDados columns={colunas} rows={linhas} actions={aoEditarAcessos ? (funcao) => <Botao variant="outline" onClick={() => aoEditarAcessos(funcao.id)}><Icone name="edit" size={18} /> Editar acessos</Botao> : undefined} empty={
            <EstadoVazio icon="settings" title="Nenhuma função encontrada">
              {funcoes.length ? "Ajuste a busca para encontrar uma função." : "Não há funções cadastradas para exibir."}
            </EstadoVazio>
          } />
        </>
      )}
    </div>
  );
}

export default function FuncoesSistema() {
  const { requisitar, podeAcessar, usuario, atualizarContexto } = usarAutenticacao();
  const permitido = podeAcessar("TELA_FUNCOES_SISTEMA");
  const servico = useMemo(() => criarServicoFuncoesSistema(requisitar), [requisitar]);
  const recurso = usarRecursoApi(servico.listar, permitido);
  const [consulta, definirConsulta] = useState("");
  const [cadastrando, definirCadastrando] = useState(false);
  const [mensagem, definirMensagem] = useState(null);
  const [editando, definirEditando] = useState(null);

  const concluirEdicao = async (atualizada) => {
    definirEditando(null);
    definirMensagem(`Acessos da função ${atualizada.nome} atualizados com sucesso.`);
    if (atualizada.id === usuario.funcaoSistema.id) await atualizarContexto({ forcar: true });
  };

  const concluirCadastro = (criada) => {
    definirCadastrando(false);
    definirConsulta("");
    definirMensagem(`Função ${criada.nome} cadastrada com sucesso.`);
    recurso.recarregar();
  };

  if (!permitido) return null;
  return <>
    <ConteudoFuncoesSistema recurso={recurso} consulta={consulta} aoBuscar={definirConsulta} mensagem={mensagem} aoCadastrar={() => { definirMensagem(null); definirCadastrando(true); }} aoEditarAcessos={(id) => { definirMensagem(null); definirEditando(id); }} />
    {cadastrando && <FormularioFuncaoSistema service={servico} onClose={() => definirCadastrando(false)} onCreated={concluirCadastro} />}
    {editando !== null && <FormularioAcessosFuncao key={editando} roleId={editando} service={servico} onClose={() => definirEditando(null)} onSaved={concluirEdicao} />}
  </>;
}
