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

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(load);

  async function login(email, password) {
    const res = await api("/api/auth/login", { method: "POST", body: { email, password } });
    const next = { token: res.token, user: res.user };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // keep working for this session even if storage is blocked
    }
    setAuth(next);
  }

  async function register(name, email, password) {
    await api("/api/auth/register", { method: "POST", body: { name, email, password } });
    await login(email, password);
  }

  function logout() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, token: auth?.token ?? null, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}