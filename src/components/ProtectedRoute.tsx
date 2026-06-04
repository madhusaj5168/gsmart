import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/seed";
import { ReactNode } from "react";

export default function ProtectedRoute({ children, role }: { children: ReactNode; role?: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
