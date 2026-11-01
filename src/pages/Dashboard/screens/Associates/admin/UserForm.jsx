import { useState } from "react";
import { TIPOS_CRIAVEIS_ADMIN, SENHA_INICIAL, RELACOES, TIPOS_USUARIOS, ehEmail, ehDataPassada, mascararTelefone, hojeISO, adicionarDias, identificadorUnico } from "@/lib/data.js";
import { associadoDaFamilia, emailEmUso, rotuloFamilia, formatarDataCadastro } from "@/lib/people.js";
import { usarArmazenamento } from "@/store";
import { Botao, BotaoIcone, Campo, Modal, CampoSelecao } from "@/components/ui";
import FormularioFamilia from "../../Families/FamilyForm.jsx";

const rotuloTipo = (tipo) => TIPOS_USUARIOS.find((tempo) => tempo.value === tipo)?.label || "";

// Cadastro de UM usuário por vez: a diretoria só cadastra Diretoria e Associado responsável (Departamento e Dependente são cadastrados por quem é dono deles).
// user = null (novo) ou a linha da lista (edição; o tipo não pode ser trocado).
export default function FormularioUsuario({ user: usuario, onClose: aoFechar, onSave: aoSalvar }) {
  const { state: dadosAplicacao, save: salvar, toast: aviso } = usarArmazenamento();
  const editando = !!usuario;
  const [formulario, definirFormulario] = useState(() => ({
    type: usuario?.type || "",
    name: usuario?.name || "",
    email: usuario?.email || "",
    phone: usuario?.phone || "",
    birthDate: usuario?.birthDate || "",
    departmentId: usuario?.departmentIds?.[0] || "",
    familyId: usuario?.familyId || usuario?.associate?.familyId || "",
    relation: usuario?.person?.relation || "Filho(a)",
  }));
  const [erros, definirErros] = useState({});
  const [cadastrandoFamilia, definirCadastrandoFamilia] = useState(false);
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: chave === "phone" ? mascararTelefone(valor) : valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };

  // Associado responsável: só famílias já cadastradas e que ainda não têm responsável (a própria, se estiver editando).
  // Dependente: só famílias que já têm um associado responsável.
  const identificadorPropriaFamilia = editando && usuario.type === "member" ? usuario.associate.familyId : null;
  const familiasDe = (tipo) => dadosAplicacao.families.filter((elementoF) => {
    const responsavel = associadoDaFamilia(dadosAplicacao, elementoF.id);
    if (tipo === "member") return !responsavel || elementoF.id === identificadorPropriaFamilia;
    return tipo === "dependent" ? !!responsavel : true;
  });
  const opcoesFamilia = (tipo) => familiasDe(tipo).map((elementoF) => ({ value: elementoF.id, label: `${rotuloFamilia(elementoF)} · ${elementoF.address}${elementoF.number ? `, ${elementoF.number}` : ""}` }));
  const precisaDeFamilia = !!formulario.type;
  const familiasDisponiveis = precisaDeFamilia ? opcoesFamilia(formulario.type) : [];
  const semFamilia = precisaDeFamilia && familiasDisponiveis.length === 0;

  const ignorarIdentificadores = editando ? [usuario.id, ...Object.entries(dadosAplicacao.profiles)
    .filter(([, perfil]) => (usuario.type === "member" && perfil.role === "member" && perfil.associateId === usuario.id) || (usuario.type === "dependent" && perfil.personId === usuario.id))
    .map(([chave]) => chave)] : [];

  const enviar = () => {
    const proximo = {};
    if (!formulario.type) proximo.type = "Selecione o tipo de perfil.";
    if (formulario.name.trim().length < 3) proximo.name = "Informe o nome completo.";
    if (!ehEmail(formulario.email)) proximo.email = "Informe um e-mail válido.";
    else if (emailEmUso(dadosAplicacao, formulario.email, ignorarIdentificadores)) proximo.email = "Já existe um usuário com este e-mail.";
    if (formulario.phone.replace(/\D/g, "").length < 10) proximo.phone = "Informe um telefone com DDD.";
    else if (formulario.phone.length > 20) proximo.phone = "O telefone deve ter no máximo 20 caracteres.";
    if (!formulario.birthDate) proximo.birthDate = "Informe a data de nascimento.";
    else if (!ehDataPassada(formulario.birthDate)) proximo.birthDate = "Informe uma data de nascimento válida e anterior a hoje.";
    if (formulario.type === "department" && !formulario.departmentId) proximo.departmentId = "Selecione o departamento.";
    if (precisaDeFamilia && !formulario.familyId) proximo.familyId = semFamilia ? "Cadastre uma família antes de continuar." : "Selecione a família.";
    else if (precisaDeFamilia && !familiasDisponiveis.some((familia) => familia.value === formulario.familyId)) proximo.familyId = "Selecione uma família disponível.";
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar({ ...formulario, name: formulario.name.trim(), email: formulario.email.trim() });
  };

  const salvarFamilia = (familia) => {
    const novaFamilia = { ...familia, id: identificadorUnico() };
    salvar("families", novaFamilia);
    definirFormulario((anterior) => ({ ...anterior, familyId: novaFamilia.id }));
    definirErros((anteriores) => ({ ...anteriores, familyId: undefined }));
    definirCadastrandoFamilia(false);
    aviso("Família cadastrada e selecionada.");
  };

  // Exibe um formulário por vez, mantendo o rascunho do usuário neste componente.
  if (cadastrandoFamilia) return <FormularioFamilia onClose={() => definirCadastrandoFamilia(false)} onSave={salvarFamilia} hint="Ao salvar, esta família será selecionada no cadastro do usuário." />;

  return (
    <Modal title={editando ? `Editar ${rotuloTipo(formulario.type).toLowerCase()}` : "Novo usuário"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar} disabled={semFamilia}>Salvar</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {editando
          ? <Campo className="sm:col-span-2" label="Tipo de perfil" value={rotuloTipo(formulario.type)} readOnly />
          : <CampoSelecao className="sm:col-span-2" label="Tipo de perfil" value={formulario.type} onChange={(valorAuxiliar) => definirFormulario((elementoF) => ({ ...elementoF, type: valorAuxiliar, familyId: "" }))} error={erros.type} placeholder="Selecione o tipo de perfil" options={TIPOS_CRIAVEIS_ADMIN} required />}

        {formulario.type && (
          <>
            <Campo className="sm:col-span-2" label="Nome completo" value={formulario.name} onChange={definir("name")} error={erros.name} required />
            <Campo label="E-mail" type="email" value={formulario.email} onChange={definir("email")} error={erros.email} required />
            <Campo label="Telefone" type="tel" value={formulario.phone} onChange={definir("phone")} error={erros.phone} placeholder="(11) 99999-9999" maxLength={20} required />
            <Campo label="Data de nascimento" type="date" value={formulario.birthDate} onChange={definir("birthDate")} error={erros.birthDate} max={adicionarDias(hojeISO(), -1)} required />
          </>
        )}

        {formulario.type === "department" && (
          <CampoSelecao className="sm:col-span-2" label="Departamento responsável" value={formulario.departmentId} onChange={definir("departmentId")} error={erros.departmentId} placeholder="Selecione o departamento" options={dadosAplicacao.departments.map((dataValor) => ({ value: dataValor.id, label: dataValor.name }))} required />
        )}

        {precisaDeFamilia && (
          editando && usuario.type === "dependent"
            ? <Campo className="sm:col-span-2" label="Família" value={rotuloFamilia(dadosAplicacao.families.find((elementoF) => elementoF.id === formulario.familyId))} readOnly />
            : <div className="flex items-start gap-2 sm:col-span-2">
                <CampoSelecao className="min-w-0 flex-1" label="Família" value={formulario.familyId} onChange={definir("familyId")} error={erros.familyId} hint={semFamilia ? "Nenhuma família disponível. Use + para cadastrar." : undefined} placeholder={semFamilia ? "Nenhuma família disponível" : "Selecione a família"} options={familiasDisponiveis} required />
                <div className="pt-7"><BotaoIcone icon="plus" label="Cadastrar família" onClick={() => definirCadastrandoFamilia(true)} /></div>
              </div>
        )}

        {editando && <Campo label="Data de cadastro" value={formatarDataCadastro(usuario)} readOnly />}
        {formulario.type === "dependent" && <CampoSelecao label="Vínculo com o responsável" value={formulario.relation} onChange={definir("relation")} options={RELACOES} required />}
      </div>

      <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">Cada cadastro cria um único usuário. {editando ? "" : `A senha inicial é ${SENHA_INICIAL}; o próprio usuário pode alterá-la em Configurações.`}</p>
    </Modal>
  );
}
