import { useCallback, useEffect, useState } from "react";

export function usarRecursoApi(carregar, habilitado = true) {
  const [tentativa, definirTentativa] = useState(0);
  const [estado, definirEstado] = useState({ dados: null, carregando: habilitado, erro: null });

  useEffect(() => {
    if (!habilitado) {
      definirEstado({ dados: null, carregando: false, erro: null });
      return undefined;
    }
    const controle = new AbortController();
    definirEstado({ dados: null, carregando: true, erro: null });
    Promise.resolve().then(() => carregar(controle.signal)).then(
      (dados) => { if (!controle.signal.aborted) definirEstado({ dados, carregando: false, erro: null }); },
      (erro) => { if (!controle.signal.aborted && erro.name !== "AbortError") definirEstado({ dados: null, carregando: false, erro: erro.message }); },
    );
    return () => controle.abort();
  }, [carregar, habilitado, tentativa]);

  const recarregar = useCallback(() => definirTentativa((valor) => valor + 1), []);
  const atualizarDados = useCallback((atualizar) => definirEstado((anterior) => ({ ...anterior, dados: atualizar(anterior.dados) })), []);
  return { ...estado, recarregar, atualizarDados };
}
