import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { createSeed, uid } from "@/lib/data.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import ToastHost from "./ToastHost.jsx";

const STORAGE_KEY = "okinawa-sc-v2";

const StoreContext = createContext(null);

// Completa dados salvos por versões anteriores (perfis novos, famílias) sem perder o que o usuário já criou.
function migrate(seed, saved) {
  const profiles = { ...seed.profiles };
  Object.entries(saved.profiles || {}).forEach(([key, p]) => { profiles[key] = { ...seed.profiles[key], ...p }; });
  const associates = (saved.associates || seed.associates).map((a) => ({ ...a, familyId: a.familyId ?? seed.associates.find((s) => s.id === a.id)?.familyId ?? null }));
  // nome correto do departamento + departamentos novos do exemplo (ex.: Acupuntura) em dados salvos por versões anteriores
  const departments = (saved.departments || seed.departments).map((d) => (/^eisa\s*(e|&)\s*taiko$/i.test(d.name) ? { ...d, name: "Eisa Taiko" } : d));
  // só na primeira carga após esta versão (seed.v), para não recriar um departamento que a diretoria excluiu de propósito
  const firstLoad = saved.v !== seed.v;
  if (firstLoad && !departments.some((d) => d.id === "d-acupuntura")) departments.push(seed.departments.find((d) => d.id === "d-acupuntura"));
  if (!departments.some((d) => d.id === "d-acupuntura")) delete profiles.acupuntura; // sem o departamento, não há conta dele
  return { ...seed, ...saved, v: seed.v, departments, profiles, passwords: { ...seed.passwords, ...saved.passwords }, associates, families: saved.families || seed.families };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(createSeed(), JSON.parse(raw));
  } catch {
    /* localStorage indisponível: usa dados de exemplo */
  }
  return createSeed();
}

// remove contas de acesso (perfil + senha) que atendam ao critério
const withoutAccounts = (state, match) => {
  const keys = Object.keys(state.profiles).filter((key) => match(state.profiles[key], key));
  if (!keys.length) return {};
  const profiles = { ...state.profiles };
  const passwords = { ...state.passwords };
  keys.forEach((key) => { delete profiles[key]; delete passwords[key]; });
  return { profiles, passwords };
};

function reducer(state, action) {
  switch (action.type) {
    case "UPSERT": {
      const list = state[action.key];
      const exists = list.some((item) => item.id === action.item.id);
      return { ...state, [action.key]: exists ? list.map((item) => (item.id === action.item.id ? action.item : item)) : [...list, action.item] };
    }
    case "REMOVE": {
      const next = { ...state, [action.key]: state[action.key].filter((item) => item.id !== action.id) };
      if (action.key === "departments") {
        // remove as inscrições do departamento excluído
        next.enrollmentRequests = (state.enrollmentRequests || []).filter((r) => r.departmentId !== action.id);
        next.associates = state.associates.map((a) => ({
          ...a,
          departmentIds: a.departmentIds.filter((d) => d !== action.id),
          dependents: a.dependents.map((p) => ({ ...p, departmentIds: p.departmentIds.filter((d) => d !== action.id) })),
        }));
      }
      if (action.key === "associates") {
        next.enrollmentRequests = (state.enrollmentRequests || []).filter((r) => r.associateId !== action.id);
        Object.assign(next, withoutAccounts(state, (p) => p.associateId === action.id));
      }
      return next;
    }
    case "REMOVE_WHERE":
      return { ...state, [action.key]: state[action.key].filter((item) => !action.predicate(item)) };
    case "NOTIFY":
      return { ...state, notifications: [{ id: uid(), read: false, time: new Date().toISOString(), ...action.payload }, ...state.notifications] };
    case "READ":
      return { ...state, notifications: state.notifications.map((n) => (action.ids.includes(n.id) ? { ...n, read: true } : n)) };
    case "PROFILE":
      return { ...state, profiles: { ...state.profiles, [action.key]: { ...state.profiles[action.key], ...action.patch } } };
    case "PASSWORD":
      return { ...state, passwords: { ...state.passwords, [action.key]: action.value } };
    case "ADD_ACCOUNT":
      return { ...state, profiles: { ...state.profiles, [action.key]: action.profile }, passwords: { ...state.passwords, [action.key]: action.password } };
    case "UPDATE_ACCOUNTS": {
      const profiles = Object.fromEntries(Object.entries(state.profiles).map(([key, p]) => [key, action.match(p, key) ? { ...p, ...action.patch } : p]));
      return { ...state, profiles };
    }
    case "REMOVE_ACCOUNTS":
      return { ...state, ...withoutAccounts(state, action.match) };
    case "RESET":
      return createSeed();
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignora: armazenamento cheio ou bloqueado */
    }
  }, [state]);

  const toast = useCallback((message, tone = "success") => {
    const id = uid();
    setToasts((list) => [...list, { id, message, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  const confirm = useCallback((options) => setConfirmState(options), []);

  const api = useMemo(
    () => ({
      save: (key, item) => dispatch({ type: "UPSERT", key, item: item.id ? item : { ...item, id: uid() } }),
      remove: (key, id) => dispatch({ type: "REMOVE", key, id }),
      removeWhere: (key, predicate) => dispatch({ type: "REMOVE_WHERE", key, predicate }),
      // target (opcional): { departmentId } ou { associateId } restringe a notificação a quem pertence ao departamento/família
      notify: (role, title, detail, screen, target = {}) => dispatch({ type: "NOTIFY", payload: { role, title, detail, screen, ...target } }),
      markRead: (ids) => dispatch({ type: "READ", ids }),
      setProfile: (key, patch) => dispatch({ type: "PROFILE", key, patch }),
      setPassword: (key, value) => dispatch({ type: "PASSWORD", key, value }),
      addAccount: (key, profile, password) => dispatch({ type: "ADD_ACCOUNT", key, profile, password }),
      updateAccounts: (match, patch) => dispatch({ type: "UPDATE_ACCOUNTS", match, patch }),
      removeAccounts: (match) => dispatch({ type: "REMOVE_ACCOUNTS", match }),
      reset: () => dispatch({ type: "RESET" }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, ...api, toast, confirm }), [state, api, toast, confirm]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} />
      {confirmState && <ConfirmDialog {...confirmState} onClose={() => setConfirmState(null)} />}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}
