import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import PageShell from "../layout/PageShell";

const navShellStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "rgba(7, 6, 10, 0.65)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
};

const navBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(11, 15, 26, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
};

const groupStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const buttonStyle: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255, 255, 255, 0.16)",
  background: "rgba(255, 255, 255, 0.04)",
  color: "#eaf6ff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

export default function TopNav() {
  const navigate = useNavigate();
  const { isAuthed, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={navShellStyle}>
      <PageShell style={{ paddingTop: 16, paddingBottom: 12 }}>
        <div style={navBarStyle}>
          <div style={groupStyle}>
            <button type="button" style={buttonStyle} onClick={() => navigate(-1)}>
              Back
            </button>
            <button type="button" style={buttonStyle} onClick={() => navigate("/feed")}>
              Feed
            </button>
            <button type="button" style={buttonStyle} onClick={() => navigate("/dashboard")}>
              Profile
            </button>
            <button type="button" style={buttonStyle} onClick={() => navigate("/feed")}>
              Create Post
            </button>
          </div>

          {isAuthed && (
            <button type="button" style={buttonStyle} onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </PageShell>
    </div>
  );
}
