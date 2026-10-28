import AdminAssociates from "./admin/AdminAssociates.jsx";
import DepartmentMembers from "./department/DepartmentMembers.jsx";
import Family from "./member/Family.jsx";

export default function Associates({ role, account, navigate }) {
  if (role === "admin") return <AdminAssociates account={account} navigate={navigate} />;
  if (role === "department") return <DepartmentMembers account={account} />;
  return <Family role={role} account={account} />;
}
