"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ADMIN_PIN } from "@/lib/constants";
import TecdiaLogo from "@/components/layout/TecdiaLogo";

/**
 * Admin login page — PIN-based authentication for demo.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      setError("Incorrect PIN");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
    }
  };

  const handlePadPress = (digit: string) => {
    if (pin.length < 4) {
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
        background: "var(--bg-primary)",
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

        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
          Admin Access
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "32px" }}>
          Enter your 4-digit PIN
        </p>

        <form onSubmit={handleSubmit}>
          {/* PIN dots */}
          <div
            className={shake ? "animate-shake" : ""}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
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

          {/* Number pad */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map(
              (key) =>
                key === "" ? (
                  <div key="empty" />
                ) : (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      key === "←" ? handleBackspace() : handlePadPress(key)
                    }
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={pin.length < 4}
          >
            Unlock
          </Button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "12px", color: "var(--text-muted)" }}>
          Demo PIN: 1234
        </p>
      </div>
    </div>
  );
}
