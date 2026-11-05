import { usarAutenticacao } from "@/auth/AuthProvider.jsx";
import InicioDiretoria from "@/pages/Dashboard/screens/Home/Home.jsx";
import { usaVisaoGeral } from "@/pages/Dashboard/screens/Home/homeModel.js";
import InicioConta from "./AccountHome.jsx";

export default function InicioAutenticado(propriedades) {
  const { usuario } = usarAutenticacao();
  return usaVisaoGeral(usuario?.funcaoSistema?.nome)
    ? <InicioDiretoria {...propriedades} />
    : <InicioConta {...propriedades} />;
}
