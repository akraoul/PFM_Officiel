import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminAuthContextType = {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  // charge depuis localStorage au boot
  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) setTokenState(t);
  }, []);

  function setToken(t: string | null) {
    if (t) {
      localStorage.setItem("admin_token", t);
      setTokenState(t);
    } else {
      localStorage.removeItem("admin_token");
      setTokenState(null);
    }
  }

  function logout() {
    setToken(null);
  }

  const value = useMemo(() => ({ token, setToken, logout }), [token]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
