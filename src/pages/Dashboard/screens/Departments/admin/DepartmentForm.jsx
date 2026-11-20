
import { useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { usarRecursoApi } from "@/hooks/useApiResource.js";
import { criarServicoUsuarios } from "@/services/usuarios.js";
import { DIAS_SEMANA } from "@/lib/data.js";
import {
  Botao,
  Campo,
  Modal,
  CampoSelecao,
  CampoAreaTexto,
  Alternador
} from "@/components/ui";
import SeletorImagem from "@/pages/Dashboard/components/ImagePicker.jsx";
import { validarDepartamento } from "../validation.js";

export default function FormularioDepartamento({
  department: departamento,
  enrolled: matriculado = 0,
  saving: salvando = false,
  error: erroEnvio = null,
  onClose: aoFechar,
  onSave: aoSalvar
}) {
  const { requisitar } = usarAutenticacao();

  const servicoUsuarios = useMemo(
    () => criarServicoUsuarios(requisitar),
    [requisitar]
  );

  const usuarios = usarRecursoApi(servicoUsuarios.listar);

  const [formulario, definirFormulario] = useState(departamento);
  const [erros, definirErros] = useState({});

  const definir = (chave) => (valor) => {
    definirFormulario((anterior) => ({
      ...anterior,
      [chave]: valor
    }));

    definirErros((anterior) => ({
      ...anterior,
      [chave]: undefined
    }));
  };

  const definirImagem = (url, arquivo) => {
    definirFormulario((anterior) => ({
      ...anterior,
      image: url,
      imageFile: arquivo
    }));

    definirErros((anterior) => ({
      ...anterior,
      image: undefined
    }));
  };

  // Pessoas ativas que possuem uma família vinculada
  const pessoasComFamilia = (usuarios.dados || []).filter(
    (pessoa) => pessoa.ativo && pessoa.familyId
  );

  // Recupera a pessoa responsável quando estiver editando
  const pessoaProfessorAtual = pessoasComFamilia.find(
    (pessoa) =>
      String(pessoa.id) === String(formulario.professorId) ||
      String(pessoa.id) === String(formulario.responsavelId) ||
      (
        pessoa.name === formulario.teacher &&
        String(pessoa.familyId) === String(formulario.familiaId)
      )
  );

  const opcoesProfessores = pessoasComFamilia
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((pessoa) => ({
      value: String(pessoa.id),
      label: pessoa.name
    }));

  // Ao selecionar uma pessoa, recupera sua família automaticamente
  const selecionarProfessor = (id) => {
    const pessoa = pessoasComFamilia.find(
      (item) => String(item.id) === String(id)
    );

    definirFormulario((anterior) => ({
      ...anterior,
      professorId: id,
      responsavelId: id,
      teacher: pessoa?.name || "",
      familiaId: pessoa?.familyId
        ? String(pessoa.familyId)
        : ""
    }));

    definirErros((anterior) => ({
      ...anterior,
      teacher: undefined,
      familiaId: undefined,
      responsavelId: undefined
    }));
  };

  const enviar = () => {
    if (salvando) return;

    const proximo = validarDepartamento(
      formulario,
      matriculado
    );

    definirErros(proximo);

    if (!Object.keys(proximo).length) {
      aoSalvar({ ...formulario });
    }
  };

  return (
    <Modal
      size="lg"
      title={
        departamento.id
          ? "Editar departamento"
          : "Novo departamento"
      }
      onClose={aoFechar}
      footer={
        <>
          <Botao
            variant="outline"
            onClick={aoFechar}
            disabled={salvando}
          >
            Cancelar
          </Botao>

          <Botao onClick={enviar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Botao>
        </>
      }
    >
      {erroEnvio && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {erroEnvio}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <div className="grid gap-4 sm:grid-cols-2">

          <Campo
            className="sm:col-span-2"
            label="Nome do departamento"
            value={formulario.name}
            onChange={definir("name")}
            error={erros.name}
            required
          />

          <CampoAreaTexto
            className="sm:col-span-2"
            label="Descrição"
            rows={3}
            value={formulario.description}
            onChange={definir("description")}
            error={erros.description}
            required
          />

          {/* NOVO CAMPO ESCOLA */}
          <Campo
            className="sm:col-span-2"
            label="Escola"
            value={formulario.school || ""}
            onChange={definir("school")}
            error={erros.school}
            placeholder="Nome da escola"
          />

          <CampoSelecao
            label="Dia da semana"
            value={formulario.day}
            onChange={definir("day")}
            options={DIAS_SEMANA}
          />

          <Campo
            label="Horário"
            type="time"
            value={formulario.time}
            onChange={definir("time")}
          />

          {/* SELEÇÃO DE PESSOA */}
          <CampoSelecao
            label="Professor / responsável"
            placeholder="Selecione uma pessoa"
            value={String(
              pessoaProfessorAtual?.id ??
              formulario.professorId ??
              ""
            )}
            onChange={selecionarProfessor}
            options={opcoesProfessores}
            error={
              erros.teacher ||
              erros.responsavelId ||
              erros.familiaId ||
              (
                !usuarios.carregando &&
                !opcoesProfessores.length
                  ? "Cadastre uma pessoa vinculada a uma família primeiro."
                  : undefined
              )
            }
            hint={
              usuarios.carregando
                ? "Carregando pessoas..."
                : usuarios.erro ||
                  "A família será vinculada automaticamente pela pessoa selecionada."
            }
            required
          />

          <Campo
            label="Mensalidade (R$)"
            type="number"
            min="0"
            step="0.01"
            value={formulario.fee}
            onChange={definir("fee")}
            error={erros.fee}
          />

          <Campo
            className="sm:col-span-2"
            label="Limite de vagas"
            type="number"
            min="1"
            step="1"
            value={formulario.capacity}
            onChange={definir("capacity")}
            error={erros.capacity}
            required
          />

          <div className="flex items-center gap-3 sm:col-span-2">
            <Alternador
              checked={formulario.active}
              onChange={definir("active")}
              label="Departamento ativo"
            />

            <span className="text-sm font-semibold">
              Departamento ativo (aparece no site)
            </span>
          </div>
        </div>

        <SeletorImagem
          value={formulario.image}
          onChange={definirImagem}
          error={erros.image}
          removable={false}
        />
      </div>
    </Modal>
  );
}
