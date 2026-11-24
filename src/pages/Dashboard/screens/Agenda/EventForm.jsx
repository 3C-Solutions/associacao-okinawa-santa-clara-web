
import { useEffect, useState } from "react";
import {
  Botao,
  Campo,
  CampoAreaTexto,
  Modal,
  CampoSelecao,
  CaixaSelecao,
} from "@/components/ui";
import { ESPACOS_EVENTO } from "@/services/eventosApi.js";
import BuscaReservante from "./BuscaReservante.jsx";

export default function FormularioEvento({
  event: evento,
  onClose: aoFechar,
  onSave: aoSalvar,
  onListarReservantes: listarReservantes,
}) {
  const [formulario, definirFormulario] = useState({
    titulo: "",
    descricao: "",
    dtInicio: "",
    dtFim: "",
    diaInteiro: false,
    horaInicio: "09:00",
    horaFim: "10:00",
    codigoEspaco: "SALAO",
    tipoReservante: "DIRETORIA",
    fkFamilia: "",
    fkDepartamento: "",
    ...evento,
  });

  const [reservantes, definirReservantes] = useState({
    departamentos: [],
    familias: [],
  });

  const [
    carregandoReservantes,
    definirCarregandoReservantes,
  ] = useState(true);

  const [erroReservantes, definirErroReservantes] =
    useState("");

  const [erros, definirErros] = useState({});
  const [salvando, definirSalvando] = useState(false);

  useEffect(() => {
    const controle = new AbortController();

    definirCarregandoReservantes(true);

    listarReservantes({ signal: controle.signal })
      .then((dados) => {
        if (!controle.signal.aborted) {
          definirReservantes({
            departamentos: dados?.departamentos ?? [],
            familias: dados?.familias ?? [],
          });

          definirErroReservantes("");
        }
      })
      .catch((falha) => {
        if (!controle.signal.aborted) {
          definirErroReservantes(
            falha.message ||
              "Não foi possível carregar os nomes."
          );
        }
      })
      .finally(() => {
        if (!controle.signal.aborted) {
          definirCarregandoReservantes(false);
        }
      });

    return () => controle.abort();
  }, [listarReservantes]);

  const definir = (chave) => (valor) => {
    definirFormulario((anterior) => ({
      ...anterior,
      [chave]: valor,
    }));

    definirErros((anterior) => ({
      ...anterior,
      [chave]: undefined,
    }));
  };

  const definirTipo = (tipo) => {
    definirFormulario((anterior) => ({
      ...anterior,
      tipoReservante: tipo,
      fkDepartamento: "",
      fkFamilia: "",
    }));

    definirErros((anterior) => ({
      ...anterior,
      fkDepartamento: undefined,
      fkFamilia: undefined,
    }));
  };

  const enviar = async () => {
    const errosValidacao = {};

    if ((formulario.titulo || "").trim().length < 3) {
      errosValidacao.titulo = "Informe o nome do evento.";
    }

    if (!formulario.dtInicio) {
      errosValidacao.dtInicio = "Informe a data inicial.";
    }

    if (
      !formulario.dtFim ||
      formulario.dtFim < formulario.dtInicio
    ) {
      errosValidacao.dtFim =
        "A data final deve ser igual ou posterior à inicial.";
    }

    if (!formulario.codigoEspaco) {
      errosValidacao.codigoEspaco = "Selecione um espaço.";
    }

    if (
      !formulario.diaInteiro &&
      (
        !formulario.horaInicio ||
        !formulario.horaFim ||
        `${formulario.dtInicio}T${formulario.horaInicio}` >=
          `${formulario.dtFim}T${formulario.horaFim}`
      )
    ) {
      errosValidacao.horaFim =
        "O término deve ser posterior ao início.";
    }

    if (
      formulario.tipoReservante === "DEPARTAMENTO" &&
      !reservantes.departamentos.some(
        (opcao) =>
          String(opcao.id) ===
          String(formulario.fkDepartamento)
      )
    ) {
      errosValidacao.fkDepartamento =
        "Selecione um departamento pelo nome.";
    }

    if (
      formulario.tipoReservante === "FAMILIA" &&
      !reservantes.familias.some(
        (opcao) =>
          String(opcao.id) ===
          String(formulario.fkFamilia)
      )
    ) {
      errosValidacao.fkFamilia =
        "Selecione uma família pelo nome.";
    }

    definirErros(errosValidacao);

    if (Object.keys(errosValidacao).length) return;

    definirSalvando(true);

    try {
      await aoSalvar({
        titulo: formulario.titulo.trim(),
        descricao: formulario.descricao?.trim() || null,
        dtInicio: formulario.dtInicio,
        dtFim: formulario.dtFim,
        diaInteiro: formulario.diaInteiro,
        horaInicio: formulario.diaInteiro
          ? null
          : formulario.horaInicio,
        horaFim: formulario.diaInteiro
          ? null
          : formulario.horaFim,
        codigoEspaco: formulario.codigoEspaco,

        fkDepartamento:
          formulario.tipoReservante === "DEPARTAMENTO"
            ? Number(formulario.fkDepartamento)
            : null,

        fkFamilia:
          formulario.tipoReservante === "FAMILIA"
            ? Number(formulario.fkFamilia)
            : null,
      });
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Modal
      title={evento.id ? "Editar evento" : "Novo evento"}
      onClose={aoFechar}
      footer={
        <>
          <Botao
            variant="outline"
            onClick={aoFechar}
          >
            Cancelar
          </Botao>

          <Botao
            disabled={salvando}
            onClick={enviar}
          >
            Salvar evento
          </Botao>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          className="sm:col-span-2"
          label="Nome do evento"
          value={formulario.titulo}
          onChange={definir("titulo")}
          error={erros.titulo}
          maxLength={100}
          required
        />

        <CampoSelecao
          className="sm:col-span-2"
          label="Espaço para aluguel"
          value={formulario.codigoEspaco}
          onChange={definir("codigoEspaco")}
          options={ESPACOS_EVENTO}
          error={erros.codigoEspaco}
          required
        />

        <Campo
          label="Data de início"
          type="date"
          value={formulario.dtInicio}
          onChange={definir("dtInicio")}
          error={erros.dtInicio}
          required
        />

        <Campo
          label="Data de término"
          type="date"
          value={formulario.dtFim}
          onChange={definir("dtFim")}
          error={erros.dtFim}
          required
        />

        <div className="sm:col-span-2">
          <CaixaSelecao
            checked={formulario.diaInteiro}
            onChange={definir("diaInteiro")}
          >
            Evento de dia inteiro (inclusive vários dias)
          </CaixaSelecao>
        </div>

        {!formulario.diaInteiro && (
          <>
            <Campo
              label="Horário inicial"
              type="time"
              value={formulario.horaInicio || ""}
              onChange={definir("horaInicio")}
              required
            />

            <Campo
              label="Horário final"
              type="time"
              value={formulario.horaFim || ""}
              onChange={definir("horaFim")}
              error={erros.horaFim}
              required
            />
          </>
        )}

        <CampoSelecao
          label="Reservado para"
          value={formulario.tipoReservante}
          onChange={definirTipo}
          options={[
            {
              value: "DIRETORIA",
              label: "Diretoria",
            },
            {
              value: "DEPARTAMENTO",
              label: "Departamento",
            },
            {
              value: "FAMILIA",
              label: "Família",
            },
          ]}
        />

        {formulario.tipoReservante === "DEPARTAMENTO" && (
          <BuscaReservante
            label="Departamento"
            opcoes={reservantes.departamentos}
            valor={formulario.fkDepartamento}
            onChange={definir("fkDepartamento")}
            erro={erros.fkDepartamento}
            desabilitado={
              carregandoReservantes ||
              Boolean(erroReservantes)
            }
          />
        )}

        {formulario.tipoReservante === "FAMILIA" && (
          <BuscaReservante
            label="Família"
            opcoes={reservantes.familias}
            valor={formulario.fkFamilia}
            onChange={definir("fkFamilia")}
            erro={erros.fkFamilia}
            desabilitado={
              carregandoReservantes ||
              Boolean(erroReservantes)
            }
          />
        )}

        {carregandoReservantes &&
          formulario.tipoReservante !== "DIRETORIA" && (
            <p className="sm:col-span-2 text-xs text-muted">
              Carregando nomes...
            </p>
          )}

        {erroReservantes &&
          formulario.tipoReservante !== "DIRETORIA" && (
            <p
              role="alert"
              className="sm:col-span-2 text-sm text-danger"
            >
              {erroReservantes}
            </p>
          )}

        <CampoAreaTexto
          className="sm:col-span-2"
          label="Descrição (apenas Diretoria)"
          rows={3}
          value={formulario.descricao || ""}
          onChange={definir("descricao")}
          maxLength={500}
        />
      </div>
    </Modal>
  );
}
