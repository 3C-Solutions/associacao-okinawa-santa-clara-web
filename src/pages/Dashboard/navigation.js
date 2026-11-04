import InicioAutenticado from "@/pages/AuthenticatedHome/AuthenticatedHome.jsx";
import FuncoesSistema from "./screens/SystemRoles/SystemRoles.jsx";
import AssociadosAdmin from "./screens/Associates/admin/AdminAssociates.jsx";
import Agenda from "./screens/Agenda/Agenda.jsx";
import Noticias from "./screens/News/News.jsx";
import Departamentos from "./screens/Departments/Departments.jsx";
import Familias from "./screens/Families/Families.jsx";
import Financas from "./screens/Finance/Finance.jsx";
// Cada tela deve declarar uma permissão ou ser explicitamente comum à sessão autenticada.
export const NAVEGACAO_PAINEL = [
 { id: "home", label: "Início", icon: "home", comum: true, componente: InicioAutenticado },
 { id: "finance", label: "Financeiro", icon: "wallet", permissao: "TELA_FINANCEIRO", componente: Financas },
 { id: "agenda", label: "Agenda", icon: "calendar", permissao: "TELA_AGENDA", componente: Agenda, prototipo: true },
 { id: "news", label: "Notícias", icon: "news", permissao: "TELA_NOTICIAS", componente: Noticias, prototipo: true },
 {
 id: "registrations", label: "Cadastros", icon: "folder", children: [
 { id: "users", label: "Usuários", icon: "person", permissao: "TELA_USUARIOS", componente: AssociadosAdmin },
 { id: "families", label: "Famílias", icon: "groups", permissao: "TELA_FAMILIAS", componente: Familias },
 { id: "departments", label: "Departamentos", icon: "groups", permissao: "TELA_DEPARTAMENTOS", componente: Departamentos, prototipo: true },
 ],
 },
 {
 id: "system-administration", label: "Administração do Sistema", icon: "personSettings", children: [
 { id: "system-roles", label: "Funções do sistema", icon: "settings", permissao: "TELA_FUNCOES_SISTEMA", componente: FuncoesSistema },
 ],
 },
];
export function filtrarNavegacao(itens, podeAcessar) {
 return itens.flatMap((item) => {
 if (item.children) {
 const children = filtrarNavegacao(item.children, podeAcessar);
 return children.length ? [{ ...item, children }] : [];
 }
 return item.comum === true || (item.permissao && podeAcessar(item.permissao)) ? [item] : [];
 });
}
export function listarTelas(navegacao) {
 return navegacao.flatMap((item) => item.children ? listarTelas(item.children) : [item]);
}
export function resolverTela(identificador, telasPermitidas) {
 return telasPermitidas.find((item) => item.id === identificador)
 || telasPermitidas.find((item) => item.id === "home");
}
