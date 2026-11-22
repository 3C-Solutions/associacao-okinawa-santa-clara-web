import { useEffect, useState } from "react";

export function usarCapaNoticia(servico, noticia) {
  const id = noticia?.imagemUrl ? noticia.id : null;
  const [capa, definirCapa] = useState(null);

  useEffect(() => {
    definirCapa(null);
    if (id == null) return undefined;
    const controle = new AbortController();
    let url;
    servico.capa(id, controle.signal).then((blob) => {
      if (controle.signal.aborted) return;
      url = URL.createObjectURL(blob);
      definirCapa({ id, url });
    }).catch(() => {
      // Imagens indisponíveis não impedem a leitura do conteúdo.
    });
    return () => {
      controle.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, servico]);

  return capa?.id === id ? capa.url : "";
}
