import { useState } from "react";
import { StoreProvider } from "@/store";
import PublicSite from "@/pages/PublicSite/PublicSite.jsx";
import Login from "@/pages/Login/Login.jsx";
import Dashboard from "@/pages/Dashboard/Dashboard.jsx";

export default function App() {
  const [view, setView] = useState("public");
  const [account, setAccount] = useState(null);
  return (
    <StoreProvider>
      {view === "public" && <PublicSite onLogin={() => setView("login")} />}
      {view === "login" && <Login onBack={() => setView("public")} onEnter={(key) => { setAccount(key); setView("dashboard"); }} />}
      {view === "dashboard" && <Dashboard account={account} onLogout={() => { setAccount(null); setView("login"); }} />}
    </StoreProvider>
  );
}
