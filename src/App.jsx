import { useState } from "react";
import { ProvedorArmazenamento } from "@/store";
import { ProvedorAutenticacao, usarAutenticacao } from "@/auth/AuthProvider.jsx";
import { Botao, Cartao, Titulo } from "@/components/ui";
import SitePublico from "@/pages/PublicSite/PublicSite.jsx";
import Acesso from "@/pages/Login/Login.jsx";
import TrocaSenhaObrigatoria from "@/pages/Login/TrocaSenhaObrigatoria.jsx";
import Painel from "@/pages/Dashboard/Dashboard.jsx";

function Conteudo() {
  const [visualizacao, definirVisualizacao] = useState("public");
  const { usuario, status, erro, aviso, sair, tentarNovamente, limparAviso } = usarAutenticacao();
  const encerrar = () => { definirVisualizacao("login"); sair(); };

  if (["restaurando", "carregando"].includes(status) || status === "erro") {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-4">
        <Cartao className="w-full max-w-lg p-8">
          <Titulo>{status === "erro" ? "Não foi possível carregar sua conta" : "Preparando seu acesso"}</Titulo>
          <p role={status === "erro" ? "alert" : "status"} className="mt-4 text-muted">{status === "erro" ? erro : "Aguarde enquanto confirmamos sua sessão."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {status === "erro" && <Botao onClick={tentarNovamente}>Tentar novamente</Botao>}
            <Botao variant="outline" onClick={encerrar}>Voltar ao login</Botao>
          </div>
        </Cartao>
      </main>
    );
  }
  if (status === "trocaSenhaObrigatoria") return <TrocaSenhaObrigatoria onBack={encerrar} />;

  if (status === "autenticado") return (
    <ProvedorArmazenamento key={usuario.id} storageKey={`okinawa-sc-painel-prototipo:${usuario.id}`}>
      <Painel onLogout={encerrar} />
    </ProvedorArmazenamento>
  );
  if (visualizacao === "login" || aviso || erro || status === "autenticando") {
    return <Acesso onBack={() => { sair(); limparAviso(); definirVisualizacao("public"); }} />;
  }
  return <SitePublico onLogin={() => definirVisualizacao("login")} />;
}

export default function Aplicativo() {
  return <ProvedorAutenticacao><ProvedorArmazenamento><Conteudo /></ProvedorArmazenamento></ProvedorAutenticacao>;
}
