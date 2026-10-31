import AssociadosAdmin from "./admin/AdminAssociates.jsx";
import MembrosDepartamento from "./department/DepartmentMembers.jsx";
import Familia from "./member/Family.jsx";

export default function Associados({ role: papel, account: conta, navigate: navegar }) {
  if (papel === "admin") return <AssociadosAdmin account={conta} navigate={navegar} />;
  if (papel === "department") return <MembrosDepartamento account={conta} />;
  return <Familia role={papel} account={conta} />;
}
