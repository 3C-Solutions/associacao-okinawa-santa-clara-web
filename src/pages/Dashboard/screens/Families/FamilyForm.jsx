import { useCallback, useEffect, useRef, useState } from "react";
import { validarCadastroFamilia } from "@/services/familias.js";
import { Botao, Campo, CampoCep, Modal } from "@/components/ui";

export const NOVA_FAMILIA = { surname: "", address: "", number: "", complement: "", district: "", city: "", uf: "", cep: "" };

export default function FormularioFamilia({ family: familia = NOVA_FAMILIA, onClose: aoFechar, onSave: aoSalvar, hint: dica = "Depois de cadastrar a família, cadastre o associado responsável em Usuários e selecione esta família." }) {
  const [formulario, definirFormulario] = useState(familia);
  const [erros, definirErros] = useState({});
  const [salvando, definirSalvando] = useState(false);
  const [erroEnvio, definirErroEnvio] = useState(null);
  const envio = useRef(null);
  useEffect(() => () => envio.current?.abort(), []);
  const fechar = useCallback(() => { if (!envio.current) aoFechar(); }, [aoFechar]);
  const definir = (chave) => (valor) => {
    if (envio.current) return;
    const proximo = chave === "uf" ? valor.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) : valor;
    definirFormulario((elementoF) => ({ ...elementoF, [chave]: proximo }));
    definirErros((evento) => ({ ...evento, [chave]: undefined }));
    definirErroEnvio(null);
  };

  const enviar = async (evento) => {
    evento?.preventDefault();
    if (envio.current) return;
    const proximo = validarCadastroFamilia(formulario);
    definirErros(proximo);
    if (Object.keys(proximo).length) return;
    const controle = new AbortController();
    envio.current = controle;
    definirSalvando(true);
    definirErroEnvio(null);
    try {
      await aoSalvar({ ...formulario, surname: formulario.surname.trim(), address: formulario.address.trim() }, controle.signal);
    } catch (erro) {
      if (!controle.signal.aborted && erro.name !== "AbortError") definirErroEnvio(erro.message);
    } finally {
      if (!controle.signal.aborted) definirSalvando(false);
      if (envio.current === controle) envio.current = null;
    }
  };

  return (
    <Modal title={familia.id ? "Editar família" : "Nova família"} onClose={fechar} footer={<><Botao variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Botao><Botao onClick={enviar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Botao></>}>
      <form onSubmit={enviar} noValidate aria-busy={salvando}>
      <fieldset disabled={salvando} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" label="Sobrenome da família" value={formulario.surname} onChange={definir("surname")} error={erros.surname} placeholder="Ex.: Takara" required maxLength={255} disabled={salvando} />
        <CampoCep
          className="sm:col-span-2"
          value={formulario.cep}
          onChange={definir("cep")}
          error={erros.cep}
          readOnly={salvando}
          onAddressFound={(endereco) => { if (!envio.current) definirFormulario((atual) => ({ ...atual, ...endereco })); }}
        />
        <Campo className="sm:col-span-2" label="Endereço" value={formulario.address} onChange={definir("address")} error={erros.address} placeholder="Rua, avenida…" required maxLength={255} disabled={salvando} />
        <Campo label="Número" value={formulario.number} onChange={definir("number")} error={erros.number} maxLength={255} disabled={salvando} />
        <Campo label="Complemento" value={formulario.complement} onChange={definir("complement")} error={erros.complement} maxLength={255} disabled={salvando} />
        <Campo label="Bairro" value={formulario.district} onChange={definir("district")} error={erros.district} maxLength={255} disabled={salvando} />
        <Campo label="Cidade" value={formulario.city} onChange={definir("city")} error={erros.city} maxLength={255} disabled={salvando} />
        <Campo label="UF" value={formulario.uf} onChange={definir("uf")} error={erros.uf} placeholder="SP" maxLength={2} disabled={salvando} />
      </fieldset>
      {erroEnvio && <p role="alert" className="mt-4 text-sm font-semibold text-danger">{erroEnvio}</p>}
      <button type="submit" className="sr-only" tabIndex={-1} disabled={salvando}>Salvar família</button>
      <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">{dica}</p>
      </form>
    </Modal>
  );
}
