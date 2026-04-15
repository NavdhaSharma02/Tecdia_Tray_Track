"use client";

import Button from "@/components/ui/Button";

/**
 * Global error boundary.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
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
      <div style={{ fontSize: "48px", fontWeight: 800, color: "var(--warning)", marginBottom: "24px" }}>!</div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--text-muted)",
          marginBottom: "32px",
          maxWidth: "400px",
        }}
      >
        {error.message || "An unexpected error occurred."}
      </p>
      <Button variant="primary" size="lg" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
