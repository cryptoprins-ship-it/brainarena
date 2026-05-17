import type { CSSProperties } from "react";

export default function MaintenancePage() {
  return (
    <main style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>We&rsquo;re currently under maintenance</h1>
        <p style={styles.text}>Please try again in 10 minutes.</p>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    color: "#fff",
    padding: "24px",
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    textAlign: "center",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "40px 24px",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 44px)",
    marginBottom: "16px",
  },
  text: {
    fontSize: "18px",
    lineHeight: 1.6,
    color: "#cbd5e1",
  },
};
