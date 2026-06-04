import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, Users, initStore } from "@/lib/store";
import type { User } from "@/lib/seed";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initStore();
    setUser(Session.current());
  }, []);

  const login = async (email: string, password: string) => {
    const u = Session.login(email, password);
    setUser(u);
    return u;
  };
  const register = async (name: string, email: string, password: string) => {
    const u = Users.create({ name, email, password, role: "student" });
    const logged = Session.login(email, password);
    setUser(logged);
    return u;
  };
  const logout = () => {
    Session.logout();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};
