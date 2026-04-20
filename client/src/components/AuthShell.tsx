import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh" }} className="d-flex align-items-center justify-content-center p-3">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card shadow-sm">
          <div className="card-body p-4 p-md-5">
            <h1 className="h4 mb-1">{title}</h1>
            {subtitle && <p className="text-body-secondary mb-4">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

