import { useState } from "react";
import { mascararCep } from "@/lib/data.js";
import { Botao, Campo, Modal } from "@/components/ui";

export default function FormularioFamilia({ family: familia, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState(familia);
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => {
    const proximo = chave === "cep" ? mascararCep(valor) : chave === "uf" ? valor.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) : valor;
    definirFormulario((elementoF) => ({ ...elementoF, [chave]: proximo }));
    definirErros((evento) => ({ ...evento, [chave]: undefined }));
  };

  const enviar = () => {
    const proximo = {};
    if (formulario.surname.trim().length < 2) proximo.surname = "Informe o sobrenome da família.";
    if (formulario.address.trim().length < 3) proximo.address = "Informe o endereço.";
    if (formulario.uf && formulario.uf.length !== 2) proximo.uf = "Use a sigla com 2 letras.";
    if (formulario.cep && formulario.cep.replace(/\D/g, "").length !== 8) proximo.cep = "O CEP deve ter 8 dígitos.";
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar({ ...formulario, surname: formulario.surname.trim(), address: formulario.address.trim() });
  };

  return (
    <Modal title={familia.id ? "Editar família" : "Nova família"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>Salvar</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" label="Sobrenome da família" value={formulario.surname} onChange={definir("surname")} error={erros.surname} placeholder="Ex.: Takara" required />
        <Campo className="sm:col-span-2" label="Endereço" value={formulario.address} onChange={definir("address")} error={erros.address} placeholder="Rua, avenida…" required />
        <Campo label="Número" value={formulario.number} onChange={definir("number")} />
        <Campo label="Complemento" value={formulario.complement} onChange={definir("complement")} />
        <Campo label="Bairro" value={formulario.district} onChange={definir("district")} />
        <Campo label="Cidade" value={formulario.city} onChange={definir("city")} />
        <Campo label="UF" value={formulario.uf} onChange={definir("uf")} error={erros.uf} placeholder="SP" />
        <Campo label="CEP" value={formulario.cep} onChange={definir("cep")} error={erros.cep} placeholder="00000-000" />
      </div>
      <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">Depois de cadastrar a família, cadastre o associado responsável em Usuários e selecione esta família.</p>
    </Modal>
  );
}
