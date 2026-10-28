import AdminDepartments from "./admin/AdminDepartments.jsx";
import DepartmentEditor from "./department/DepartmentEditor.jsx";
import MemberDepartments from "./member/MemberDepartments.jsx";

export default function Departments({ role, account }) {
  if (role === "admin") return <AdminDepartments />;
  if (role === "department") return <DepartmentEditor account={account} />;
  return <MemberDepartments role={role} account={account} />;
}
