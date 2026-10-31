import { useState } from "react";
import { CATEGORIAS_NOTICIAS } from "@/lib/data.js";
import { Botao, Campo, Modal, CampoSelecao, CampoAreaTexto } from "@/components/ui";
import SeletorImagem from "@/pages/Dashboard/components/ImagePicker.jsx";

export default function FormularioNoticia({ news: noticias, audiences: publicos, onClose: aoFechar, onSave: aoSalvar }) {
  const [formulario, definirFormulario] = useState(noticias);
  const [erros, definirErros] = useState({});
  const definir = (chave) => (valor) => { definirFormulario((elementoF) => ({ ...elementoF, [chave]: valor })); definirErros((evento) => ({ ...evento, [chave]: undefined })); };
  const enviar = () => {
    const proximo = {};
    if (formulario.title.trim().length < 3) proximo.title = "Informe o título.";
    if (formulario.body.trim().length < 10) proximo.body = "Escreva o conteúdo da notícia (mínimo de 10 caracteres).";
    definirErros(proximo);
    if (!Object.keys(proximo).length) aoSalvar({ ...formulario, title: formulario.title.trim(), body: formulario.body.trim() });
  };
  return (
    <Modal size="lg" title={noticias.id ? "Editar notícia" : "Nova notícia"} onClose={aoFechar} footer={<><Botao variant="outline" onClick={aoFechar}>Cancelar</Botao><Botao onClick={enviar}>{formulario.status === "Publicado" ? "Publicar" : "Salvar rascunho"}</Botao></>}>
      <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo className="sm:col-span-2" label="Título" value={formulario.title} onChange={definir("title")} error={erros.title} required />
          <CampoSelecao label="Classificação" value={formulario.category} onChange={definir("category")} options={CATEGORIAS_NOTICIAS} />
          <CampoSelecao label="Destinado à" value={formulario.audience} onChange={definir("audience")} options={publicos} />
          <CampoSelecao className="sm:col-span-2" label="Status" value={formulario.status} onChange={definir("status")} options={["Publicado", "Rascunho"]} />
          <CampoAreaTexto className="sm:col-span-2" label="Conteúdo" rows={6} value={formulario.body} onChange={definir("body")} error={erros.body} required />
        </div>
        <SeletorImagem label="Imagem da notícia" value={formulario.image} onChange={definir("image")} />
      </div>
    </Modal>
  );
}
