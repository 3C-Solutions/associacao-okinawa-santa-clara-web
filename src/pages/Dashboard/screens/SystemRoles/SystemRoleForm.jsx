import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoFuncionalidadesSistema } from "@/services/funcionalidadesSistema.js";
import { validarCadastroFuncao } from "@/services/funcoesSistema.js";
import { Botao, Campo, CampoAreaTexto, Modal } from "@/components/ui";

export default function FormularioFuncaoSistema({ service: servico, onClose: aoFechar, onCreated: aoCadastrar }) {
  const { requisitar, podeAcessar } = usarAutenticacao();
  const permitido = podeAcessar("TELA_FUNCOES_SISTEMA");
  const servicoCatalogo = useMemo(() => criarServicoFuncionalidadesSistema(requisitar), [requisitar]);
  const catalogo = usarRecursoApi(servicoCatalogo.listar, permitido);
  const [formulario, definirFormulario] = useState({ nome: "", descricao: "", idsFuncionalidades: [] });
  const [erros, definirErros] = useState({});
  const [erroEnvio, definirErroEnvio] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const fechar = useCallback(() => { if (!envio.current) aoFechar(); }, [aoFechar]);
  const definir = (chave, valor) => {
    definirFormulario((anterior) => ({ ...anterior, [chave]: valor }));
    definirErros((anterior) => ({ ...anterior, [chave]: undefined }));
    definirErroEnvio(null);
  };
  const selecionar = (id, marcado) => {
    definirFormulario((anterior) => ({ ...anterior, idsFuncionalidades: marcado
      ? [...new Set([...anterior.idsFuncionalidades, id])]
      : anterior.idsFuncionalidades.filter((selecionado) => selecionado !== id) }));
    definirErros((anterior) => ({ ...anterior, idsFuncionalidades: undefined }));
    definirErroEnvio(null);
  };
  const indisponiveis = formulario.idsFuncionalidades.filter((id) => catalogo.dados && !catalogo.dados.some((item) => item.id === id));
  const catalogoPronto = !!catalogo.dados?.length && !catalogo.carregando && !catalogo.erro;

  const enviar = async (evento) => {
    evento?.preventDefault();
    if (envio.current || !permitido || !catalogoPronto) return;
    const proximo = validarCadastroFuncao(formulario);
    if (indisponiveis.length) proximo.idsFuncionalidades = "Remova as seleções indisponíveis e revise as funcionalidades.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    definirErroEnvio(null);
    try {
      const criada = await servico.cadastrar(formulario, controle.signal);
      if (!controle.signal.aborted) aoCadastrar(criada);
    } catch (erro) {
      if (!controle.signal.aborted && erro.name !== "AbortError") {
        definirErroEnvio(erro.message);
        if (erro.status === 409) definirErros((anterior) => ({ ...anterior, nome: erro.message }));
      }
    } finally {
      if (!controle.signal.aborted) definirSalvando(false);
      if (envio.current === controle) envio.current = null;
    }
  };

  if (!permitido) return null;
  return (
    <Modal title="Nova função do sistema" onClose={fechar} footer={<>
      <Botao variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Botao>
      <Botao onClick={enviar} disabled={salvando || !catalogoPronto}>{salvando ? "Salvando..." : "Cadastrar função"}</Botao>
    </>}>
      <form onSubmit={enviar} noValidate aria-busy={salvando} className="space-y-5">
        <Campo label="Nome da função" value={formulario.nome} onChange={(valor) => definir("nome", valor)} error={erros.nome} required maxLength={100} disabled={salvando} />
        <CampoAreaTexto label="Descrição (opcional)" value={formulario.descricao} onChange={(valor) => definir("descricao", valor)} error={erros.descricao} rows={3} maxLength={255} disabled={salvando} />
        <fieldset disabled={salvando || !catalogoPronto} aria-busy={catalogo.carregando} className="space-y-3">
          <legend className="mb-2 text-sm font-semibold">Funcionalidades autorizadas <span className="text-danger">*</span></legend>
          <p className="text-sm text-muted">Selecione pelo menos uma funcionalidade para esta função.</p>
          {catalogo.carregando ? <p role="status" className="text-sm text-muted">Carregando funcionalidades...</p> : catalogo.erro ? (
            <p role="alert" className="text-sm text-danger">{catalogo.erro}</p>
          ) : !catalogo.dados?.length ? (
            <p role="status" className="text-sm text-muted">Não há funcionalidades cadastradas. O cadastro de funções ficará disponível quando houver opções.</p>
          ) : catalogo.dados.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-divider p-3 has-disabled:cursor-not-allowed has-disabled:bg-gray-100">
              <input type="checkbox" checked={formulario.idsFuncionalidades.includes(item.id)} onChange={(evento) => selecionar(item.id, evento.target.checked)} className="mt-1 size-4 shrink-0 accent-brand" />
              <span className="min-w-0"><span className="block text-sm font-semibold">{item.nome}</span>{item.descricao && <span className="mt-1 block text-xs text-muted">{item.descricao}</span>}</span>
            </label>
          ))}
          {erros.idsFuncionalidades && <p role="alert" className="text-sm text-danger">{erros.idsFuncionalidades}</p>}
        </fieldset>
        {!catalogo.carregando && <Botao variant="outline" onClick={catalogo.recarregar} disabled={salvando}>Recarregar funcionalidades</Botao>}
        {indisponiveis.length > 0 && <div className="space-y-2">
          <p role="alert" className="text-sm text-warning">Algumas funcionalidades selecionadas deixaram de estar disponíveis. Revise a seleção antes de salvar.</p>
          <Botao variant="outline" disabled={salvando} onClick={() => definir("idsFuncionalidades", formulario.idsFuncionalidades.filter((id) => !indisponiveis.includes(id)))}>Remover seleções indisponíveis</Botao>
        </div>}
        <p className="text-xs text-muted">Após o cadastro, atribua esta função aos usuários pela tela de edição de usuários.</p>
        {erroEnvio && <p role="alert" className="text-sm font-semibold text-danger">{erroEnvio}</p>}
        <button type="submit" className="sr-only" tabIndex={-1} disabled={salvando || !catalogoPronto}>Cadastrar função</button>
      </form>
    </Modal>
  );
}
