import { useState } from "react";
import { ProvedorArmazenamento } from "@/store";
import SitePublico from "@/pages/PublicSite/PublicSite.jsx";
import Acesso from "@/pages/Login/Login.jsx";
import Painel from "@/pages/Dashboard/Dashboard.jsx";

export default function Aplicativo() {
  const [visualizacao, definirVisualizacao] = useState("public");
  const [conta, definirConta] = useState(null);
  return (
    <ProvedorArmazenamento>
      {visualizacao === "public" && <SitePublico onLogin={() => definirVisualizacao("login")} />}
      {visualizacao === "login" && <Acesso onBack={() => definirVisualizacao("public")} onEnter={(chave) => { definirConta(chave); definirVisualizacao("dashboard"); }} />}
      {visualizacao === "dashboard" && <Painel account={conta} onLogout={() => { definirConta(null); definirVisualizacao("login"); }} />}
    </ProvedorArmazenamento>
  );
}
