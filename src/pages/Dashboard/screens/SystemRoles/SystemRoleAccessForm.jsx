import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoFuncionalidadesSistema } from "@/services/funcionalidadesSistema.js";
import { Botao, Campo, CampoAreaTexto, Modal } from "@/components/ui";
import SelecaoFuncionalidades from "./FunctionalitySelection.jsx";

export function CamposAcessosFuncao({ funcao, funcionalidades, service: servico, onClose: aoFechar, onSaved: aoSalvar, onReload: aoRecarregar }) {
  const { usuario, podeAcessar } = usarAutenticacao();
  const [selecionadas, definirSelecionadas] = useState(() => funcao.funcionalidades.map((item) => item.id));
  const [erro, definirErro] = useState(null);
  const [salvando, definirSalvando] = useState(false);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const fechar = useCallback(() => { if (!envio.current) aoFechar(); }, [aoFechar]);
  const minhaFuncao = usuario.funcaoSistema.id === funcao.id;
  const removeAdministracao = minhaFuncao && !funcionalidades.some((item) => item.codigo === "TELA_FUNCOES_SISTEMA" && selecionadas.includes(item.id));
  const selecionar = (id, marcado) => {
    definirSelecionadas((anteriores) => marcado ? [...new Set([...anteriores, id])] : anteriores.filter((item) => item !== id));
    definirErro(null);
  };
  const enviar = async (evento) => {
    evento?.preventDefault();
    if (envio.current || !podeAcessar("TELA_FUNCOES_SISTEMA")) return;
    if (selecionadas.some((id) => !funcionalidades.some((item) => item.id === id))) {
      definirErro("Remova as seleções indisponíveis antes de salvar.");
      return;
    }
    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    definirErro(null);
    try {
      const atualizada = await servico.atualizarAcessos(funcao, selecionadas, controle.signal);
      if (!controle.signal.aborted) await aoSalvar(atualizada);
    } catch (falha) {
      if (!controle.signal.aborted && falha.name !== "AbortError") {
        definirErro(falha.message);
      }
    } finally {
      if (!controle.signal.aborted) definirSalvando(false);
      if (envio.current === controle) envio.current = null;
    }
  };

  if (!podeAcessar("TELA_FUNCOES_SISTEMA")) return null;
  return <Modal title={`Editar acessos de ${funcao.nome}`} onClose={fechar} footer={<>
    <Botao variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Botao>
    <Botao onClick={enviar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar acessos"}</Botao>
  </>}>
    <form onSubmit={enviar} noValidate className="space-y-5" aria-busy={salvando}>
      <Campo label="Nome da função" value={funcao.nome} readOnly />
      <CampoAreaTexto label="Descrição" value={funcao.descricao || "Não informada"} readOnly rows={2} />
      <p className="text-sm text-muted">As alterações serão aplicadas a todos os usuários vinculados a esta função.</p>
      <SelecaoFuncionalidades catalogo={{ dados: funcionalidades, carregando: false, erro: null }} selecionadas={selecionadas} aoSelecionar={selecionar} aoRemoverIndisponiveis={definirSelecionadas} salvando={salvando} permiteVazio />
      {removeAdministracao && <p role="status" className="rounded-lg bg-warning-soft p-3 text-sm text-warning">Você está retirando o acesso administrativo da sua própria função. Após salvar, esta tela será fechada e você voltará ao Início.</p>}
      {erro && <p role="alert" className="text-sm font-semibold text-danger">{erro}</p>}
      {erro && <div className="space-y-2">
        <p className="text-sm text-muted">Recarregar substitui sua seleção pelos acessos salvos no sistema.</p>
        <Botao variant="outline" onClick={aoRecarregar} disabled={salvando}>Recarregar dados</Botao>
      </div>}
      <button type="submit" className="sr-only" tabIndex={-1} disabled={salvando}>Salvar acessos</button>
    </form>
  </Modal>;
}

export default function FormularioAcessosFuncao({ roleId: id, service: servico, onClose: aoFechar, onSaved: aoSalvar }) {
  const { requisitar, podeAcessar } = usarAutenticacao();
  const permitido = podeAcessar("TELA_FUNCOES_SISTEMA");
  const catalogo = useMemo(() => criarServicoFuncionalidadesSistema(requisitar), [requisitar]);
  const carregar = useCallback(async (signal) => {
    const [funcao, funcionalidades] = await Promise.all([servico.buscar(id, signal), catalogo.listar(signal)]);
    return { funcao, funcionalidades };
  }, [servico, catalogo, id]);
  const recurso = usarRecursoApi(carregar, permitido);
  if (!permitido) return null;
  if (recurso.dados && !recurso.carregando && !recurso.erro) return <CamposAcessosFuncao key={id} {...recurso.dados} service={servico} onClose={aoFechar} onSaved={aoSalvar} onReload={recurso.recarregar} />;
  return <Modal title="Editar acessos da função" onClose={aoFechar} footer={<Botao variant="outline" onClick={aoFechar}>Fechar</Botao>}>
    {recurso.carregando && <p role="status" className="py-6 text-center text-muted">Carregando a função e suas funcionalidades...</p>}
    {recurso.erro && <div className="space-y-4"><p role="alert" className="text-sm text-danger">{recurso.erro}</p><Botao variant="outline" onClick={recurso.recarregar}>Tentar novamente</Botao></div>}
  </Modal>;
}
