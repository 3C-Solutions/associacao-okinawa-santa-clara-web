import { useState } from "react";
import { DIAS_SEMANA } from "@/lib/data.js";
import { capacidadeDe, membrosDe, vagasRestantes } from "@/lib/people.js";
import { usarArmazenamento, usarUsuario } from "@/store";
import { Botao, Cartao, EstadoVazio, Campo, Icone, CabecalhoPagina, CampoSelecao, CampoAreaTexto } from "@/components/ui";
import SeletorImagem from "@/pages/Dashboard/components/ImagePicker.jsx";
import { validarDepartamento } from "../validation.js";
import UsuariosDepartamento from "./DepartmentUsers.jsx";

// ---------- Departamento (responsável edita o próprio) ----------
export default function EditorDepartamento({ account: conta }) {
  const { state: dadosAplicacao, save: salvar, toast: aviso } = usarArmazenamento();
  const usuario = usarUsuario(conta);
  const departamento = usuario.department;
  const [editando, definirEditando] = useState(false);
  const [formulario, definirFormulario] = useState(departamento ? { ...departamento, fee: String(departamento.fee), capacity: String(capacidadeDe(departamento) || "") } : null);
  const [erros, definirErros] = useState({});
  if (!departamento) return <Cartao><EstadoVazio icon="groups" title="Departamento não encontrado">O departamento deste perfil foi excluído pela Diretoria.</EstadoVazio></Cartao>;
  const membros = membrosDe(dadosAplicacao, departamento.id);
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const cancelar = () => { definirFormulario({ ...departamento, fee: String(departamento.fee), capacity: String(capacidadeDe(departamento) || "") }); definirErros({}); definirEditando(false); };
  const enviar = () => {
    const proximo = validarDepartamento(formulario, membros.length);
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    salvar("departments", { ...formulario, name: formulario.name.trim(), description: formulario.description.trim(), teacher: formulario.teacher.trim(), fee: Number(formulario.fee), capacity: Number(formulario.capacity) });
    aviso("Informações do departamento salvas");
    definirEditando(false);
  };
  return (
    <div>
      <CabecalhoPagina>
        {editando ? <><Botao variant="outline" onClick={cancelar}>Cancelar</Botao><Botao onClick={enviar}><Icone name="check" size={18} /> Salvar alterações</Botao></> : <Botao variant="secondary" onClick={() => definirEditando(true)}><Icone name="edit" size={18} /> Alterar informações</Botao>}
      </CabecalhoPagina>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <Campo label="Nome do departamento" value={formulario.name} onChange={definir("name")} error={erros.name} readOnly={!editando} />
          <CampoAreaTexto label="Descrição" rows={3} value={formulario.description} onChange={editando ? definir("description") : () => {}} error={erros.description} />
          <div className="grid gap-5 md:grid-cols-2">
            {editando ? <CampoSelecao label="Dia da semana" value={formulario.day} onChange={definir("day")} options={DIAS_SEMANA} /> : <Campo label="Dia da semana" value={formulario.day} readOnly />}
            <Campo label="Horário" type="time" value={formulario.time} onChange={definir("time")} readOnly={!editando} />
            <Campo label="Professor" value={formulario.teacher} onChange={definir("teacher")} error={erros.teacher} readOnly={!editando} />
            <Campo label="Valor da mensalidade (R$)" type="number" min="0" step="0.01" value={formulario.fee} onChange={definir("fee")} error={erros.fee} readOnly={!editando} />
            <Campo label="Limite de inscritos" type="number" min="1" step="1" value={formulario.capacity} onChange={definir("capacity")} error={erros.capacity} readOnly={!editando} hint={`${membros.length} inscritos · ${capacidadeDe(departamento) ? `${vagasRestantes(dadosAplicacao, departamento)} vagas disponíveis` : "sem limite definido"}`} />
          </div>
          <Cartao className="p-5">
            <h2 className="font-bold">Inscritos ({membros.length}{capacidadeDe(departamento) ? ` de ${capacidadeDe(departamento)}` : ""})</h2>
            <p className="mt-1 text-xs text-muted">Para aprovar solicitações ou adicionar e remover inscritos, use a tela Associados.</p>
            {membros.length === 0 ? <p className="mt-2 text-sm text-muted">Ninguém inscrito ainda.</p> : <p className="mt-2 text-sm leading-relaxed text-muted">{membros.map((mes) => mes.name).join(", ")}</p>}
          </Cartao>
          <UsuariosDepartamento department={departamento} account={conta} />
        </div>
        <div className="xl:col-span-4">
          {editando ? <SeletorImagem value={formulario.image} onChange={definir("image")} /> : (
            <div>
              <span className="mb-2 block text-sm font-semibold">Imagem do departamento</span>
              {departamento.image ? <img src={departamento.image} alt="" className="aspect-video w-full rounded-xl object-cover" /> : <Cartao className="grid aspect-video place-items-center border-dashed text-brand"><Icone name="upload" size={28} /></Cartao>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
