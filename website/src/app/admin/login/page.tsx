"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import TecdiaLogo from "@/components/layout/TecdiaLogo";
import { API_BASE } from "@/lib/constants";

/**
 * Admin login page — 6-digit PIN validated on the server.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
        credentials: "include", // Include cookies in request
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        sessionStorage.setItem("admin_auth", "true");
        router.push("/admin");
      } else {
        setError(data.error || "Incorrect PIN");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
      }
    } catch {
      setError("Could not reach server");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePadPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        background:
          "radial-gradient(circle at top right, rgba(187, 129, 105, 0.12), transparent 22%), radial-gradient(circle at bottom left, rgba(95, 126, 84, 0.1), transparent 18%), linear-gradient(180deg, #f5ede6 0%, #efe1d5 100%)",
      }}
    >
      <div
        className="animate-scale-pop glass-card"
        style={{
          padding: "40px",
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
        }}
      >
        <div style={{ margin: "0 auto 20px", display: "inline-flex" }}>
          <TecdiaLogo size="md" />
        </div>

        <span className="app-shell-eyebrow" style={{ marginBottom: "16px" }}>
          Admin access
        </span>
        <h1 style={{ fontSize: "36px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px", lineHeight: 1 }}>
          Admin Access
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "32px", lineHeight: 1.7 }}>
          Enter your 6-digit PIN
        </p>

        <form onSubmit={handleSubmit}>
          <div
            className={shake ? "animate-shake" : ""}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: i < pin.length ? "var(--accent)" : "var(--bg-elevated)",
                  border: `2px solid ${i < pin.length ? "var(--accent)" : "var(--border)"}`,
                  transition: "all 0.15s ease",
                  boxShadow: i < pin.length ? "0 0 10px var(--accent-glow)" : "none",
                }}
              />
            ))}
          </div>

          {error && (
            <p
              className="animate-slide-up"
              style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "16px" }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map((key) =>
              key === "" ? (
                <div key="empty" />
              ) : (
                <button
                  key={key}
                  type="button"
                  onClick={() => (key === "←" ? handleBackspace() : handlePadPress(key))}
                  className="btn btn-ghost"
                  style={{
                    height: "56px",
                    fontSize: "22px",
                    fontWeight: 600,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {key}
                </button>
              )
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={pin.length < 6}
              isLoading={submitting}
            >
              Unlock
            </Button>
            <Link href="/" className="btn btn-outline btn-lg w-full pin-modal-back" style={{ textDecoration: "none" }}>
              Back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
