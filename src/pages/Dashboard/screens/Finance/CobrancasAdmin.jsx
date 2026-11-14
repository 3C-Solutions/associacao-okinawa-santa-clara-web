import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Botao,
  Campo,
  CampoSelecao,
  Modal,
  Cartao,
  EntradaBusca,
  SeloStatus,
  EstadoVazio,
} from "@/components/ui";
import { formatarData, formatarMoeda, hojeISO } from "@/lib/data.js";

const grupos = [
  {
    value: "diretoria",
    label: "Diretoria",
    descricao: "Usuários com perfil de Diretoria",
  },
  {
    value: "departamentos",
    label: "Departamentos",
    descricao: "Responsáveis pelos departamentos",
  },
  {
    value: "associados_responsaveis",
    label: "Associados responsáveis",
    descricao: "Titulares das famílias",
  },
  {
    value: "associados",
    label: "Associados",
    descricao: "Demais associados",
  },
];

const vazio = {
  nome_da_cobranca: "",
  periodo: "Mensal",
  valor: "",
  vencimento: hojeISO(),
  forma_selecao: "",
  grupos_destinatarios: [],
  usuarios_especificos: [],
};

function Emissao({ api, onClose, onSuccess }) {
  const [dados, setDados] = useState(vazio);
  const [busca, setBusca] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [paginas, setPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [selecionados, setSelecionados] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const atualizar = (campo) => (valor) =>
    setDados((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

  useEffect(() => {
    if (dados.forma_selecao !== "usuarios") {
      return undefined;
    }

    const controle = new AbortController();

    const timeout = setTimeout(() => {
      api
        .destinatarios(busca, pagina, 20, {
          signal: controle.signal,
        })
        .then((resposta) => {
          if (!controle.signal.aborted) {
            setUsuarios(resposta.usuarios || []);
            setPaginas(resposta.paginas || 0);
            setTotal(resposta.total || 0);
          }
        })
        .catch((e) => {
          if (!controle.signal.aborted) {
            setErro(e.message);
          }
        });
    }, 280);

    return () => {
      clearTimeout(timeout);
      controle.abort();
    };
  }, [api, dados.forma_selecao, busca, pagina]);

  const alterarGrupo = (nome) => {
    setDados((anterior) => ({
      ...anterior,
      grupos_destinatarios: anterior.grupos_destinatarios.includes(nome)
        ? anterior.grupos_destinatarios.filter((grupo) => grupo !== nome)
        : [...anterior.grupos_destinatarios, nome],
    }));
  };

  const alternarUsuario = (usuario) => {
    setSelecionados((anterior) => {
      const copia = { ...anterior };

      if (copia[usuario.id_usuario]) {
        delete copia[usuario.id_usuario];
      } else {
        copia[usuario.id_usuario] = usuario;
      }

      return copia;
    });
  };

  const quantidade = Object.keys(selecionados).length;

  const emitir = async (event) => {
    event?.preventDefault();

    if (salvando) return;

    const valor = Number(String(dados.valor).replace(",", "."));

    if (
      !dados.nome_da_cobranca.trim() ||
      !(valor > 0) ||
      !dados.vencimento ||
      !dados.forma_selecao
    ) {
      setErro(
        "Preencha o nome da cobrança, o valor, vencimento e os destinatários."
      );
      return;
    }

    const destinatarios =
      dados.forma_selecao === "usuarios"
        ? Object.keys(selecionados).map(Number)
        : [];

    if (dados.forma_selecao === "usuarios" && !destinatarios.length) {
      setErro("Selecione ao menos um usuário.");
      return;
    }

    if (
      dados.forma_selecao === "grupos" &&
      !dados.grupos_destinatarios.length
    ) {
      setErro("Selecione ao menos um grupo.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      await api.emitirCobranca({
        ...dados,
        valor,
        nome_da_cobranca: dados.nome_da_cobranca.trim(),
        usuarios_especificos: destinatarios,
      });

      onClose();
      await onSuccess?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      size="lg"
      title="Enviar cobrança"
      onClose={onClose}
      footer={
        <>
          <Botao
            variant="outline"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </Botao>

          <Botao onClick={emitir} disabled={salvando}>
            {salvando ? "Enviando..." : "Emitir cobrança"}
          </Botao>
        </>
      }
    >
      <form className="space-y-5" onSubmit={emitir}>
        <Campo
          label="Nome da cobrança"
          maxLength={500}
          value={dados.nome_da_cobranca}
          onChange={atualizar("nome_da_cobranca")}
          required
          placeholder="Ex.: Mensalidade Taiko"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelecao
            label="Periodicidade"
            value={dados.periodo}
            options={["Mensal", "Anual", "Avulsa"]}
            onChange={(periodo) => {
              setDados((anterior) => ({
                ...anterior,
                periodo,
                grupos_destinatarios: [],
                usuarios_especificos: [],
              }));

              setSelecionados({});
              setPagina(0);
              setErro("");
            }}
          />

          <Campo
            label="Valor (R$)"
            type="number"
            value={dados.valor}
            onChange={atualizar("valor")}
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <Campo
          label="Vencimento"
          type="date"
          value={dados.vencimento}
          onChange={atualizar("vencimento")}
          required
        />

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-bold">
            Forma de selecionar destinatários *
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                value: "grupos",
                label: "Grupos destinatários",
                descricao: "Selecionar por perfis",
              },
              {
                value: "usuarios",
                label: "Usuários específicos",
                descricao: "Pesquisar por nome ou e-mail",
              },
            ].map((opcao) => (
              <label
                key={opcao.value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                  dados.forma_selecao === opcao.value
                    ? "border-brand bg-brand-soft"
                    : "border-divider"
                }`}
              >
                <input
                  type="radio"
                  name="selecao"
                  checked={dados.forma_selecao === opcao.value}
                  onChange={() => {
                    setDados((anterior) => ({
                      ...anterior,
                      forma_selecao: opcao.value,
                      grupos_destinatarios: [],
                      usuarios_especificos: [],
                    }));

                    setSelecionados({});
                    setPagina(0);
                    setErro("");
                  }}
                  className="accent-brand"
                />

                <span>
                  <strong className="block text-sm">
                    {opcao.label}
                  </strong>

                  <small className="text-muted">
                    {opcao.descricao}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {dados.forma_selecao === "grupos" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {grupos.map((grupo) => {
              const incompativel =
                (dados.periodo === "Mensal" &&
                  grupo.value !== "departamentos") ||
                (dados.periodo === "Anual" &&
                  grupo.value !== "associados_responsaveis");

              return (
                <label
                  key={grupo.value}
                  className={`flex gap-3 rounded-xl border p-3 ${
                    incompativel ? "opacity-45" : "cursor-pointer"
                  } ${
                    dados.grupos_destinatarios.includes(grupo.value)
                      ? "border-brand bg-brand-soft"
                      : "border-divider"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={dados.grupos_destinatarios.includes(
                      grupo.value
                    )}
                    disabled={incompativel}
                    onChange={() => alterarGrupo(grupo.value)}
                    className="accent-brand"
                  />

                  <span>
                    <strong className="block text-sm">
                      {grupo.label}
                    </strong>

                    <span className="text-xs text-muted">
                      {grupo.descricao}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {dados.forma_selecao === "usuarios" && (
          <div className="space-y-3">
            <EntradaBusca
              placeholder="Pesquisar por nome ou e-mail"
              value={busca}
              onChange={(valor) => {
                setBusca(valor);
                setPagina(0);
              }}
            />

            <p className="text-xs text-muted">
              {total} usuário(s) encontrado(s). É possível selecionar
              pessoas de várias páginas.
            </p>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {usuarios.map((usuario) => {
                const incompativel =
                  (dados.periodo === "Mensal" &&
                    usuario.grupo !== "Departamentos") ||
                  (dados.periodo === "Anual" &&
                    usuario.grupo !== "Associados responsáveis");

                return (
                  <label
                    key={usuario.id_usuario}
                    className={`flex items-center gap-3 rounded-lg border border-divider px-3 py-2 text-sm ${
                      incompativel ? "opacity-45" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={incompativel}
                      checked={!!selecionados[usuario.id_usuario]}
                      onChange={() => alternarUsuario(usuario)}
                      className="accent-brand"
                    />

                    <span>
                      <strong className="block">
                        {usuario.nome}
                      </strong>

                      <span className="text-xs text-muted">
                        {usuario.email} · {usuario.grupo}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-sm">
              <Botao
                variant="outline"
                disabled={pagina === 0}
                onClick={() => setPagina((anterior) => anterior - 1)}
              >
                Anterior
              </Botao>

              <span>
                Página {pagina + 1} de {Math.max(1, paginas)}
              </span>

              <Botao
                variant="outline"
                disabled={pagina + 1 >= paginas}
                onClick={() => setPagina((anterior) => anterior + 1)}
              >
                Próxima
              </Botao>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.values(selecionados).map((usuario) => (
                <button
                  key={usuario.id_usuario}
                  type="button"
                  onClick={() => alternarUsuario(usuario)}
                  className="rounded-full bg-brand-soft px-3 py-1 text-xs text-brand"
                >
                  {usuario.nome} ×
                </button>
              ))}
            </div>

            <p className="text-sm font-semibold">
              {quantidade} destinatário(s) selecionado(s)
              {quantidade > 0 && (
                <>
                  {" "}· Total estimado:{" "}
                  {formatarMoeda(
                    quantidade * Number(dados.valor || 0)
                  )}
                </>
              )}
            </p>
          </div>
        )}

        <p className="text-xs text-muted">
          Mensal: responsáveis pelos departamentos. Anual:
          associados responsáveis. Avulsa: qualquer destinatário
          selecionado. Uma cobrança recorrente não pode ser
          duplicada no mesmo período.
        </p>

        {erro && (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft p-3 text-sm text-danger"
          >
            {erro}
          </p>
        )}

        <button hidden type="submit" />
      </form>
    </Modal>
  );
}

export default function CobrancasAdmin({ api, onChange }) {
  const [pagamentos, setPagamentos] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [modal, setModal] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  const carregar = useCallback(async () => {
    setCarregando(true);

    try {
      const [respostaPagamentos, respostaCobrancas] =
        await Promise.all([
          api.pagamentosCobranca(),
          api.cobrancas(),
        ]);

      setPagamentos(respostaPagamentos);
      setCobrancas(respostaCobrancas);
      setErro("");
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [api]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const revisar = async (id, confirmar) => {
    setOcupado(true);
    setErro("");

    try {
      if (confirmar) {
        await api.confirmarPagamento(id);
      } else {
        await api.recusarPagamento(id);
      }

      await carregar();
      onChange?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const filtrados = useMemo(
    () =>
      pagamentos.filter(
        (pagamento) =>
          filtro === "Todos" || pagamento.status === filtro
      ),
    [pagamentos, filtro]
  );

  return (
    <section className="space-y-5" aria-label="Verificar pagamentos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            Cobranças e pagamentos
          </h2>

          <p className="text-sm text-muted">
            Emita as cobranças e confirme recebimentos
            informados pelos responsáveis.
          </p>
        </div>

        <Botao onClick={() => setModal(true)}>
          + Enviar cobranças do período
        </Botao>
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft p-3 text-sm text-danger"
        >
          {erro}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Cartao className="p-4">
          <p className="text-xs text-muted">
            Cobranças cadastradas
          </p>

          <strong className="text-2xl text-brand">
            {cobrancas.length}
          </strong>
        </Cartao>

        <Cartao className="p-4">
          <p className="text-xs text-muted">
            Aguardando pagamento
          </p>

          <strong className="text-2xl text-brand">
            {
              pagamentos.filter(
                (pagamento) => pagamento.status === "Pendente"
              ).length
            }
          </strong>
        </Cartao>

        <Cartao className="p-4">
          <p className="text-xs text-muted">
            Em verificação
          </p>

          <strong className="text-2xl text-brand">
            {
              pagamentos.filter(
                (pagamento) =>
                  pagamento.status === "Em verificação"
              ).length
            }
          </strong>
        </Cartao>
      </div>

      <CampoSelecao
        label="Filtrar por situação"
        value={filtro}
        onChange={setFiltro}
        options={[
          "Todos",
          "Pendente",
          "Em verificação",
          "Pago",
          "Recusado",
        ]}
        className="max-w-xs"
      />

      {carregando ? (
        <p>Carregando cobranças...</p>
      ) : !filtrados.length ? (
        <EstadoVazio
          icon="wallet"
          title="Nenhum pagamento encontrado"
        />
      ) : (
        <Cartao className="divide-y divide-divider overflow-hidden">
          {filtrados.map((pagamento) => (
            <div
              key={pagamento.id_pagamento_cobranca}
              className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"
            >
              <div>
                <p className="font-semibold">
                  {pagamento.nome_da_cobranca} ·{" "}
                  {pagamento.destinatario}
                </p>

                <p className="text-xs text-muted">
                  {pagamento.periodo} · Vencimento{" "}
                  {formatarData(pagamento.vencimento)} ·{" "}
                  {pagamento.forma_pagamento}
                </p>

                <p className="mt-1 font-bold text-brand">
                  {formatarMoeda(Number(pagamento.valor))}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <SeloStatus status={pagamento.status} />

                {pagamento.status === "Em verificação" && (
                  <>
                    <Botao
                      disabled={ocupado}
                      onClick={() =>
                        revisar(
                          pagamento.id_pagamento_cobranca,
                          true
                        )
                      }
                    >
                      Confirmar
                    </Botao>

                    <Botao
                      variant="outline"
                      disabled={ocupado}
                      onClick={() =>
                        revisar(
                          pagamento.id_pagamento_cobranca,
                          false
                        )
                      }
                    >
                      Recusar
                    </Botao>
                  </>
                )}
              </div>
            </div>
          ))}
        </Cartao>
      )}

      {modal && (
        <Emissao
          api={api}
          onClose={() => setModal(false)}
          onSuccess={async () => {
            await carregar();
            onChange?.();
          }}
        />
      )}
    </section>
  );
}
