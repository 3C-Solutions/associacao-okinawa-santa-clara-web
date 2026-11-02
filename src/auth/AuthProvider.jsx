import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { criarClienteApi } from "@/lib/api.js";
import { criarSessao } from "./session.js";

const ContextoAutenticacao = createContext(null);

export function ProvedorAutenticacao({ children, sessao: sessaoFornecida }) {
  const [sessao] = useState(() => {
    if (sessaoFornecida) return sessaoFornecida;
    let storage;
    try { storage = window.sessionStorage; } catch { /* Permite login somente em memória. */ }
    return criarSessao({ api: criarClienteApi(), storage });
  });
  const estado = useSyncExternalStore(sessao.subscribe, sessao.getState, sessao.getState);

  useEffect(() => {
    sessao.restaurar();
    const atualizar = () => {
      if (document.visibilityState === "hidden") return;
      if (!sessao.verificarExpiracao() && sessao.getState().status === "autenticado") sessao.atualizarContexto();
    };
    window.addEventListener("focus", atualizar);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      window.removeEventListener("focus", atualizar);
      document.removeEventListener("visibilitychange", atualizar);
      sessao.cancelarPendencias();
    };
  }, [sessao]);

  const valor = useMemo(() => ({
    ...estado,
    entrar: sessao.entrar,
    sair: sessao.sair,
    tentarNovamente: sessao.atualizarContexto,
    atualizarContexto: sessao.atualizarContexto,
    requisitar: sessao.requisitar,
    limparAviso: sessao.limparAviso,
    podeAcessar: (codigo) => estado.status === "autenticado" && estado.permissoes.includes(codigo),
  }), [estado, sessao]);

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>;
}

export function usarAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) throw new Error("usarAutenticacao deve ser utilizado dentro do ProvedorAutenticacao");
  return contexto;
}
