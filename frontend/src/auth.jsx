import { createContext, useContext, useState } from "react";
import { api } from "./api";

const KEY = "bowl-auth";
const AuthContext = createContext(null);

function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.token && !isExpired(saved.token)) return saved;
    localStorage.removeItem(KEY);
  } catch {
    // storage unavailable or corrupted: start logged out
  }
  return null;
}

function save(value) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    // keep working for this session even if storage is blocked
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(load);

  async function login(email, password) {
    const res = await api("/api/auth/login", { method: "POST", body: { email, password } });
    const next = { token: res.token, user: res.user };
    save(next);
    setAuth(next);
  }

  async function register(name, email, password) {
    await api("/api/auth/register", { method: "POST", body: { name, email, password } });
    await login(email, password);
  }

  function updateUser(user) {
    if (!auth) return;
    const next = { ...auth, user };
    save(next);
    setAuth(next);
  }

  function logout() {
    save(null);
    setAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{ user: auth?.user ?? null, token: auth?.token ?? null, login, register, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}