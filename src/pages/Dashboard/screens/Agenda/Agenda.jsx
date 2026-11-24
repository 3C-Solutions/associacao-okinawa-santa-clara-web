
import { useEffect, useMemo, useRef, useState } from "react";
import { MESES, formatarData, deISO, hojeISO } from "@/lib/data.js";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarArmazenamento } from "@/store";
import {
  Botao,
  Cartao,
  TabelaDados,
  EstadoVazio,
  Icone,
  BotaoIcone,
  SeloStatus,
} from "@/components/ui";
import Calendario from "@/pages/Dashboard/components/Calendar.jsx";
import FormularioEvento from "./EventForm.jsx";
import FormularioReserva from "./ReservationForm.jsx";
import ModalRejeicao from "./RejectModal.jsx";
import {
  criarServicoEventos,
  ESPACOS_EVENTO,
} from "@/services/eventosApi.js";

const normalizar = (valor = "") =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");

const identificarPapel = (nome) => {
  const papel = normalizar(nome);

  if (["DIRETORIA", "DIRETOR"].includes(papel)) {
    return "DIRETORIA";
  }

  if (
    ["DEPARTAMENTO", "RESPONSAVEL DEPARTAMENTO"].includes(
      papel
    )
  ) {
    return "DEPARTAMENTO";
  }

  if (
    ["ASSOCIADO RESPONSAVEL", "ASSOCIADO TITULAR"].includes(
      papel
    )
  ) {
    return "FAMILIA";
  }

  if (
    ["ASSOCIADO DEPENDENTE", "DEPENDENTE"].includes(papel)
  ) {
    return "DEPENDENTE";
  }

  return "DESCONHECIDO";
};

const completar = (valor) => String(valor).padStart(2, "0");

const primeiroMes = ({ y, m }) =>
  `${y}-${completar(m + 1)}-01`;

const ultimoMes = ({ y, m }) =>
  `${y}-${completar(m + 1)}-${completar(
    new Date(y, m + 1, 0).getDate()
  )}`;

const intervalo = (evento) =>
  evento.diaInteiro
    ? "Dia inteiro"
    : `${evento.horaInicio?.slice(0, 5)} às ${evento.horaFim?.slice(0, 5)}`;

const periodo = (evento) =>
  `${formatarData(evento.dtInicio)}${
    evento.dtFim !== evento.dtInicio
      ? ` a ${formatarData(evento.dtFim)}`
      : ""
  }`;

const espaco = (codigo) =>
  ESPACOS_EVENTO.find((item) => item.value === codigo)?.label ||
  codigo;

const rotulosStatus = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelada",
};

export default function Agenda() {
  const { usuario, requisitar, podeAcessar } =
    usarAutenticacao();

  const {
    toast: aviso,
    confirm: confirmar,
  } = usarArmazenamento();

  const api = useMemo(
    () => criarServicoEventos(requisitar),
    [requisitar]
  );

  const papel = identificarPapel(
    usuario?.funcaoSistema?.nome
  );

  const administrador = papel === "DIRETORIA";

  const solicitante =
    papel === "DEPARTAMENTO" || papel === "FAMILIA";

  const hoje = hojeISO();

  const [visualizacao, definirVisualizacao] = useState({
    y: deISO(hoje).getFullYear(),
    m: deISO(hoje).getMonth(),
  });

  const [selecionado, definirSelecionado] = useState(hoje);
  const [eventos, definirEventos] = useState([]);
  const [reservas, definirReservas] = useState([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState("");
  const [versao, definirVersao] = useState(0);

  const [
    formularioEvento,
    definirFormularioEvento,
  ] = useState(null);

  const [
    formularioReserva,
    definirFormularioReserva,
  ] = useState(false);

  const [rejeitando, definirRejeitando] = useState(null);
  const referenciaSolicitacoes = useRef(null);

  const atualizar = () =>
    definirVersao((anterior) => anterior + 1);

  useEffect(() => {
    if (
      !podeAcessar("TELA_AGENDA") ||
      papel === "DESCONHECIDO"
    ) {
      return undefined;
    }

    const controle = new AbortController();

    definirCarregando(true);
    definirErro("");

    const inicio = primeiroMes(visualizacao);
    const fim = ultimoMes(visualizacao);

    const pedidos = administrador
      ? api.solicitacoes({ signal: controle.signal })
      : solicitante
        ? api.minhasSolicitacoes({
            signal: controle.signal,
          })
        : Promise.resolve([]);

    Promise.all([
      administrador
        ? api.listar(inicio, fim, {
            signal: controle.signal,
          })
        : api.calendario(inicio, fim, {
            signal: controle.signal,
          }),
      pedidos,
    ])
      .then(([calendario, solicitacoes]) => {
        if (controle.signal.aborted) return;

        definirEventos(
          calendario.filter((evento) =>
            administrador
              ? evento.status === "APROVADO"
              : true
          )
        );

        definirReservas(solicitacoes);
      })
      .catch((falha) => {
        if (!controle.signal.aborted) {
          definirErro(
            falha.message ||
              "Não foi possível carregar a agenda."
          );
        }
      })
      .finally(() => {
        if (!controle.signal.aborted) {
          definirCarregando(false);
        }
      });

    return () => controle.abort();
  }, [
    api,
    visualizacao,
    administrador,
    solicitante,
    papel,
    versao,
    podeAcessar,
  ]);

  const operar = async (operacao, mensagem) => {
    try {
      await operacao();
      aviso(mensagem);
      atualizar();
      return true;
    } catch (falha) {
      aviso(
        falha.message ||
          "Não foi possível concluir a operação.",
        "error"
      );
      return false;
    }
  };

  const marcacoes = {};

  const marcarPeriodo = (evento, marca) => {
    let dia = deISO(evento.dtInicio);
    const ultimo = deISO(evento.dtFim);

    while (dia <= ultimo) {
      const iso =
        `${dia.getFullYear()}-` +
        `${completar(dia.getMonth() + 1)}-` +
        `${completar(dia.getDate())}`;

      marcacoes[iso] = marca;
      dia.setDate(dia.getDate() + 1);
    }
  };

  reservas
    .filter((evento) => evento.status === "PENDENTE")
    .forEach((evento) => marcarPeriodo(evento, "pending"));

  eventos.forEach((evento) =>
    marcarPeriodo(evento, "event")
  );

  const eventosDoDia = eventos.filter(
    (evento) =>
      evento.dtInicio <= selecionado &&
      evento.dtFim >= selecionado
  );

  const pendentes = reservas.filter(
    (evento) => evento.status === "PENDENTE"
  );

  const pendenciasDoDia = pendentes.filter(
    (evento) =>
      evento.dtInicio <= selecionado &&
      evento.dtFim >= selecionado
  );

  const eventosMensais = [...eventos].sort((a, b) =>
    (a.dtInicio + (a.horaInicio || "")).localeCompare(
      b.dtInicio + (b.horaInicio || "")
    )
  );

  const colunasEventos = [
    {
      key: "dtInicio",
      label: "Data",
      render: periodo,
    },
    {
      key: "horario",
      label: "Período",
      render: intervalo,
    },
    {
      key: "reservadoPara",
      label: "Reservado para",
    },
    ...(administrador
      ? [
          {
            key: "titulo",
            label: "Evento",
          },
          {
            key: "codigoEspaco",
            label: "Espaço",
            render: (evento) =>
              espaco(evento.codigoEspaco),
          },
        ]
      : []),
  ];

  const colunasReservas = [
    {
      key: "dtInicio",
      label: "Período",
      render: (reserva) =>
        `${periodo(reserva)} · ${intervalo(reserva)}`,
    },
    {
      key: "titulo",
      label: "Finalidade",
      render: (reserva) => (
        <span>
          {reserva.titulo}
          {reserva.motivoRecusa && (
            <span className="mt-1 block text-xs text-muted">
              Motivo: {reserva.motivoRecusa}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "codigoEspaco",
      label: "Espaço",
      render: (reserva) =>
        espaco(reserva.codigoEspaco),
    },
    ...(administrador
      ? [
          {
            key: "reservadoPara",
            label: "Solicitante",
          },
        ]
      : []),
    {
      key: "status",
      label: "Situação",
      render: (reserva) => (
        <SeloStatus
          status={
            rotulosStatus[reserva.status] ||
            reserva.status
          }
        />
      ),
    },
  ];

  if (
    !podeAcessar("TELA_AGENDA") ||
    papel === "DESCONHECIDO"
  ) {
    return (
      <p role="alert">
        Seu perfil não está habilitado para a Agenda.
        Confira as permissões com a Diretoria.
      </p>
    );
  }

  const confirmarCancelamento = (
    evento,
    pedido = false
  ) =>
    confirmar({
      title: pedido
        ? "Cancelar solicitação"
        : "Cancelar evento",
      message: `Confirma o cancelamento de “${evento.titulo}”?`,
      confirmLabel: "Cancelar",
      onConfirm: () =>
        operar(
          () =>
            pedido
              ? api.cancelarSolicitacao(evento.id)
              : api.cancelar(evento.id),
          "Cancelamento registrado"
        ),
    });

  return (
    <div className="space-y-6">
      {erro && (
        <div
          role="alert"
          className="rounded-lg border border-danger p-3 text-sm text-danger"
        >
          {erro}{" "}
          <Botao
            variant="outline"
            onClick={atualizar}
          >
            Tentar novamente
          </Botao>
        </div>
      )}

      {carregando && (
        <p
          role="status"
          className="text-sm text-muted"
        >
          Carregando agenda...
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Calendario
            marks={marcacoes}
            selected={selecionado}
            onSelect={definirSelecionado}
            view={visualizacao}
            onView={definirVisualizacao}
          />
        </div>

        <div className="flex flex-col gap-6 xl:col-span-5">
          {(administrador || solicitante) && (
            <Cartao className="flex flex-col gap-3 p-6">
              <h2 className="mb-1 text-lg font-bold">
                Ações da agenda
              </h2>

              {administrador ? (
                <>
                  <Botao
                    onClick={() =>
                      definirFormularioEvento({
                        dtInicio: selecionado,
                        dtFim: selecionado,
                      })
                    }
                  >
                    <Icone name="plus" size={18} />
                    Novo evento
                  </Botao>

                  <Botao
                    variant="secondary"
                    onClick={() =>
                      referenciaSolicitacoes.current?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                  >
                    Autorizar reservas ({pendentes.length})
                  </Botao>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Selecione as datas e o espaço para
                    enviar uma solicitação à Diretoria.
                  </p>

                  <Botao
                    onClick={() =>
                      definirFormularioReserva(true)
                    }
                  >
                    Solicitar reserva
                  </Botao>
                </>
              )}
            </Cartao>
          )}

          <Cartao className="flex-1 p-6">
            <h2 className="text-lg font-bold">
              {formatarData(selecionado)}
            </h2>

            {!eventosDoDia.length &&
            !pendenciasDoDia.length ? (
              <p className="mt-3 text-sm text-muted">
                Nenhuma reserva neste dia.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-divider">
                {eventosDoDia.map((evento) => (
                  <li
                    key={evento.id}
                    className="py-3"
                  >
                    <p className="text-sm font-semibold">
                      {administrador
                        ? evento.titulo
                        : "Período reservado"}
                    </p>

                    <p className="text-xs text-muted">
                      {intervalo(evento)} ·{" "}
                      {evento.reservadoPara}
                    </p>

                    {administrador && (
                      <p className="text-xs text-muted">
                        {espaco(evento.codigoEspaco)}
                      </p>
                    )}
                  </li>
                ))}

                {pendenciasDoDia.map((reserva) => (
                  <li
                    key={reserva.id}
                    className="py-3"
                  >
                    <p className="text-sm font-semibold">
                      {reserva.titulo} (Pendente)
                    </p>

                    <p className="text-xs text-muted">
                      {intervalo(reserva)} ·{" "}
                      {espaco(reserva.codigoEspaco)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Eventos de {MESES[visualizacao.m]} de{" "}
          {visualizacao.y}
        </h2>

        <TabelaDados
          columns={colunasEventos}
          rows={eventosMensais}
          empty={
            <EstadoVazio
              icon="calendar"
              title="Nenhum evento neste mês"
            >
              Consulte outro período.
            </EstadoVazio>
          }
          actions={
            administrador
              ? (evento) => (
                  <>
                    <BotaoIcone
                      icon="edit"
                      label="Editar"
                      size="sm"
                      onClick={() =>
                        definirFormularioEvento({
                          ...evento,
                          tipoReservante:
                            evento.tipoReservante ||
                            (evento.fkDepartamento
                              ? "DEPARTAMENTO"
                              : evento.fkFamilia
                                ? "FAMILIA"
                                : "DIRETORIA"),
                        })
                      }
                    />

                    <BotaoIcone
                      icon="trash"
                      label="Cancelar"
                      tone="danger"
                      size="sm"
                      onClick={() =>
                        confirmarCancelamento(evento)
                      }
                    />

                    {evento.statusSincronizacao !==
                      "SINCRONIZADO" && (
                      <BotaoIcone
                        icon="clock"
                        label="Tentar sincronizar Google"
                        size="sm"
                        onClick={() =>
                          operar(
                            () =>
                              api.sincronizar(evento.id),
                            "Sincronização solicitada"
                          )
                        }
                      />
                    )}
                  </>
                )
              : undefined
          }
        />
      </section>

      {(administrador || solicitante) && (
        <section
          ref={referenciaSolicitacoes}
          className="scroll-mt-6"
        >
          <h2 className="mb-3 text-lg font-bold">
            {administrador
              ? "Solicitações de reserva"
              : "Minhas solicitações"}
          </h2>

          <TabelaDados
            columns={colunasReservas}
            rows={reservas}
            empty={
              <EstadoVazio
                icon="clock"
                title="Nenhuma solicitação"
              >
                Nenhum pedido registrado.
              </EstadoVazio>
            }
            actions={(reserva) =>
              reserva.status === "PENDENTE"
                ? administrador
                  ? (
                      <>
                        <BotaoIcone
                          icon="check"
                          label="Aprovar"
                          size="sm"
                          onClick={() =>
                            operar(
                              () =>
                                api.aprovar(reserva.id),
                              "Solicitação aprovada"
                            )
                          }
                        />

                        <BotaoIcone
                          icon="close"
                          label="Recusar"
                          tone="danger"
                          size="sm"
                          onClick={() =>
                            definirRejeitando(reserva)
                          }
                        />
                      </>
                    )
                  : (
                      <BotaoIcone
                        icon="trash"
                        label="Cancelar solicitação"
                        tone="danger"
                        size="sm"
                        onClick={() =>
                          confirmarCancelamento(
                            reserva,
                            true
                          )
                        }
                      />
                    )
                : null
            }
          />
        </section>
      )}

      {formularioEvento && (
        <FormularioEvento
          event={formularioEvento}
          onListarReservantes={api.reservantes}
          onClose={() =>
            definirFormularioEvento(null)
          }
          onSave={async (dados) => {
            const ok = await operar(
              () =>
                formularioEvento.id
                  ? api.editar(
                      formularioEvento.id,
                      dados
                    )
                  : api.criar(dados),
              "Evento salvo"
            );

            if (ok) definirFormularioEvento(null);
          }}
        />
      )}

      {formularioReserva && (
        <FormularioReserva
          initialDate={
            selecionado >= hoje ? selecionado : hoje
          }
          today={hoje}
          onClose={() =>
            definirFormularioReserva(false)
          }
          onSave={async (dados) => {
            const ok = await operar(
              () => api.solicitar(dados),
              "Solicitação enviada à Diretoria"
            );

            if (ok) definirFormularioReserva(false);
          }}
        />
      )}

      {rejeitando && (
        <ModalRejeicao
          reservation={rejeitando}
          onClose={() =>
            definirRejeitando(null)
          }
          onConfirm={async (motivo) => {
            const ok = await operar(
              () =>
                api.recusar(rejeitando.id, motivo),
              "Solicitação recusada"
            );

            if (ok) definirRejeitando(null);
          }}
        />
      )}
    </div>
  );
}
