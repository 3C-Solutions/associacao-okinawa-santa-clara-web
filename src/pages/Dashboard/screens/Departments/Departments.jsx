import DepartamentosAdmin from "./admin/AdminDepartments.jsx";
import EditorDepartamento from "./department/DepartmentEditor.jsx";
import DepartamentosMembro from "./member/MemberDepartments.jsx";

export default function Departamentos({ role: papel, account: conta }) {
  if (papel === "admin") return <DepartamentosAdmin />;
  if (papel === "department") return <EditorDepartamento account={conta} />;
  return <DepartamentosMembro role={papel} account={conta} />;
}
