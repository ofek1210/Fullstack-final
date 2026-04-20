import type { CSSProperties, ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: number;
  style?: CSSProperties;
};

function getDirection() {
  if (typeof document === "undefined") return "ltr";
  return document.documentElement.getAttribute("dir") || "ltr";
}

export default function PageShell({ children, maxWidth = 1100, style }: PageShellProps) {
  return (
    <div
      dir={getDirection()}
      style={{
        width: "100%",
        padding: "32px clamp(16px, 4vw, 24px)",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
}
