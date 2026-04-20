import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import PageShell from "../components/layout/PageShell";
import TopNav from "../components/nav/TopNav";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthed } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <>
      <TopNav />
      <PageShell>{children}</PageShell>
    </>
  );
}
