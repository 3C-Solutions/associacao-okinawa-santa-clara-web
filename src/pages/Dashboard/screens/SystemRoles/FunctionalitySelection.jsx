import { Botao } from "@/components/ui";

export default function SelecaoFuncionalidades({ catalogo, selecionadas, aoSelecionar, aoRemoverIndisponiveis, erro, salvando, permiteVazio = false }) {
  const pronto = catalogo.dados !== null && !catalogo.carregando && !catalogo.erro;
  const indisponiveis = selecionadas.filter((id) => catalogo.dados && !catalogo.dados.some((item) => item.id === id));
  return <>
    <fieldset disabled={salvando || !pronto} aria-busy={catalogo.carregando} className="space-y-3">
      <legend className="mb-2 text-sm font-semibold">Funcionalidades autorizadas{!permiteVazio && <span className="text-danger"> *</span>}</legend>
      <p className="text-sm text-muted">{permiteVazio ? "Marque os acessos permitidos. Desmarcar todas as opções deixa o perfil com acesso apenas ao Início." : "Selecione pelo menos uma funcionalidade para esta função."}</p>
      {catalogo.carregando ? <p role="status" className="text-sm text-muted">Carregando funcionalidades...</p> : catalogo.erro ? (
        <p role="alert" className="text-sm text-danger">{catalogo.erro}</p>
      ) : !catalogo.dados?.length ? (
        <p role="status" className="text-sm text-muted">{permiteVazio ? "Não há funcionalidades disponíveis no catálogo." : "Não há funcionalidades cadastradas. O cadastro de funções ficará disponível quando houver opções."}</p>
      ) : catalogo.dados.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-divider p-3 has-disabled:cursor-not-allowed has-disabled:bg-gray-100">
          <input type="checkbox" checked={selecionadas.includes(item.id)} onChange={(evento) => aoSelecionar(item.id, evento.target.checked)} className="mt-1 size-4 shrink-0 accent-brand" />
          <span className="min-w-0"><span className="block text-sm font-semibold">{item.nome}</span>{item.descricao && <span className="mt-1 block text-xs text-muted">{item.descricao}</span>}</span>
        </label>
      ))}
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
    </fieldset>
    {!catalogo.carregando && catalogo.recarregar && <Botao variant="outline" onClick={catalogo.recarregar} disabled={salvando}>Recarregar funcionalidades</Botao>}
    {indisponiveis.length > 0 && <div className="space-y-2">
      <p role="alert" className="text-sm text-warning">Algumas funcionalidades selecionadas deixaram de estar disponíveis. Revise a seleção antes de salvar.</p>
      <Botao variant="outline" disabled={salvando} onClick={() => aoRemoverIndisponiveis(selecionadas.filter((id) => !indisponiveis.includes(id)))}>Remover seleções indisponíveis</Botao>
    </div>}
  </>;
}
