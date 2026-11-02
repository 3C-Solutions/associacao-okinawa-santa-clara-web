import { useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoFuncoesSistema } from "@/services/funcoesSistema.js";
import { Botao, Cartao, EntradaBusca, EstadoVazio, TabelaDados } from "@/components/ui";

const colunas = [
  { key: "nome", label: "Nome", render: (funcao) => <span className="font-semibold">{funcao.nome}</span> },
  { key: "descricao", label: "Descrição", render: (funcao) => <span className="whitespace-pre-wrap break-words text-muted">{funcao.descricao.trim() || "Não informada"}</span> },
];

export function ConteudoFuncoesSistema({ recurso, consulta, aoBuscar }) {
  const funcoes = recurso.dados || [];
  const termo = consulta.trim().toLocaleLowerCase("pt-BR");
  const linhas = funcoes.filter((funcao) => !termo || `${funcao.nome} ${funcao.descricao}`.toLocaleLowerCase("pt-BR").includes(termo));

  return (
    <div className="space-y-6" aria-busy={recurso.carregando}>
      <EntradaBusca value={consulta} onChange={aoBuscar} placeholder="Buscar por nome ou descrição" className="sm:max-w-md" />
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
          <TabelaDados columns={colunas} rows={linhas} empty={
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
  const { requisitar, podeAcessar } = usarAutenticacao();
  const permitido = podeAcessar("TELA_FUNCOES_SISTEMA");
  const servico = useMemo(() => criarServicoFuncoesSistema(requisitar), [requisitar]);
  const recurso = usarRecursoApi(servico.listar, permitido);
  const [consulta, definirConsulta] = useState("");

  if (!permitido) return null;
  return <ConteudoFuncoesSistema recurso={recurso} consulta={consulta} aoBuscar={definirConsulta} />;
}
