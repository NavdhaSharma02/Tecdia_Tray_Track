import Link from "next/link";

/**
 * 404 Not Found page.
 */
export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "16px" }}>?</div>
      <h1
        style={{
          fontSize: "48px",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "8px",
          fontFamily: "var(--font-mono)",
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: "18px",
          color: "var(--text-secondary)",
          marginBottom: "32px",
        }}
      >
        Page not found
      </p>
      <Link href="/" className="btn btn-primary btn-lg">
        Go Home
      </Link>
    </div>
  );
}
