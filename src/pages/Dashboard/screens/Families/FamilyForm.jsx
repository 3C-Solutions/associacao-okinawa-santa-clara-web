import { useMemo, useState } from "react";
import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Campo, CampoCep, Modal } from "@/components/ui";
import { criarServicoFamilias } from "@/services/familias.js";

export const NOVA_FAMILIA = { surname: "", address: "", number: "", complement: "", district: "", city: "", uf: "", cep: "" };

export default function FormularioFamilia({ family: familia = NOVA_FAMILIA, onClose: aoFechar, onSave: aoSalvar, hint: dica = "Depois de cadastrar a família, cadastre o associado responsável em Usuários e selecione esta família." }) {
  const { requisitar } = usarAutenticacao();
  const servicoFamilias = useMemo(() => criarServicoFamilias(requisitar), [requisitar]);
  const [formulario, definirFormulario] = useState(familia);
  const [erros, definirErros] = useState({});
  const [erroSalvar, definirErroSalvar] = useState("");
  const [salvando, definirSalvando] = useState(false);
  const fechar = () => { if (!salvando) aoFechar(); };
  const definir = (chave) => (valor) => {
    const proximo = chave === "uf" ? valor.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) : valor;
    definirFormulario((elementoF) => ({ ...elementoF, [chave]: proximo }));
    definirErros((evento) => ({ ...evento, [chave]: undefined }));
    definirErroSalvar("");
  };

  const enviar = async () => {
    if (salvando) return;
    const proximo = {};
    if (formulario.surname.trim().length < 2) proximo.surname = "Informe o sobrenome da família.";
    if (formulario.address.trim().length < 3) proximo.address = "Informe o endereço.";
    if (formulario.uf && formulario.uf.length !== 2) proximo.uf = "Use a sigla com 2 letras.";
    if (formulario.cep && formulario.cep.replace(/\D/g, "").length !== 8) proximo.cep = "O CEP deve ter 8 dígitos.";
    definirErros(proximo);
    if (Object.keys(proximo).length) return;

    const dadosFamilia = { ...formulario, surname: formulario.surname.trim(), address: formulario.address.trim() };
    if (familia.apiManaged) {
      definirErroSalvar("A API ainda não oferece atualização de famílias. Nenhuma alteração foi salva.");
      return;
    }
    if (familia.id) {
      aoSalvar(dadosFamilia);
      return;
    }

    definirSalvando(true);
    definirErroSalvar("");
    try {
      const persistidos = await servicoFamilias.cadastrar(dadosFamilia);
      await aoSalvar({ ...dadosFamilia, ...persistidos });
    } catch (falha) {
      if (falha.name === "AbortError") return;
      definirErroSalvar(falha.message || "Não foi possível salvar o endereço. Tente novamente.");
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Modal title={familia.id ? "Editar família" : "Nova família"} onClose={fechar} footer={<><Botao variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Botao><Botao onClick={enviar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Botao></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo className="sm:col-span-2" label="Sobrenome da família" value={formulario.surname} onChange={definir("surname")} error={erros.surname} placeholder="Ex.: Takara" required />
        <Campo className="sm:col-span-2" label="Endereço" value={formulario.address} onChange={definir("address")} error={erros.address} placeholder="Rua, avenida…" required />
        <Campo label="Número" value={formulario.number} onChange={definir("number")} />
        <Campo label="Complemento" value={formulario.complement} onChange={definir("complement")} />
        <Campo label="Bairro" value={formulario.district} onChange={definir("district")} />
        <Campo label="Cidade" value={formulario.city} onChange={definir("city")} />
        <Campo label="UF" value={formulario.uf} onChange={definir("uf")} error={erros.uf} placeholder="SP" />
        <CampoCep
          value={formulario.cep}
          onChange={definir("cep")}
          error={erros.cep}
          onAddressFound={(endereco) => definirFormulario((atual) => ({ ...atual, ...endereco }))}
        />
      </div>
      {erroSalvar && <p role="alert" className="mt-4 text-sm text-danger">{erroSalvar}</p>}
      <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-xs text-brand">{dica}</p>
    </Modal>
  );
}
