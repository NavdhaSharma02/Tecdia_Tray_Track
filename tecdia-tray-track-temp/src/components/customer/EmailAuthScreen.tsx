"use client";

import { useState } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type AuthMode = "login" | "signup";

export default function EmailAuthScreen() {
  const {
    loginWithEmail,
    signUpWithEmail,
    backToIdScan,
    isLoading,
    error,
    clearError,
  } = useCustomerFlow();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLocalError(null);
    if (error) clearError();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (error) clearError();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setLocalError("Email and password are required.");
      return;
    }

    if (mode === "signup") {
      if (!fullName.trim()) {
        setLocalError("Full name is required for signup.");
        return;
      }
      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
      await signUpWithEmail({
        fullName: fullName.trim(),
        email: trimmedEmail,
        password,
      });
      return;
    }

    await loginWithEmail({ email: trimmedEmail, password });
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      <div className="app-panel" style={{ padding: "28px" }}>
        <span className="app-shell-eyebrow" style={{ marginBottom: "14px" }}>
          Customer access
        </span>
        <h2
          style={{
            fontSize: "38px",
            fontWeight: 700,
            marginBottom: "8px",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {mode === "login" ? "Login with Email" : "Create Account"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "18px", lineHeight: 1.7 }}>
          {mode === "login"
            ? "Sign in to continue to tray scanning."
            : "Create your customer account for tray scanning."}
        </p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          <Button
            variant={mode === "login" ? "primary" : "outline"}
            size="md"
            onClick={() => handleModeChange("login")}
            type="button"
            className="w-full"
          >
            Login
          </Button>
          <Button
            variant={mode === "signup" ? "primary" : "outline"}
            size="md"
            onClick={() => handleModeChange("signup")}
            type="button"
            className="w-full"
          >
            Sign Up
          </Button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          {mode === "signup" && (
            <Input
              label="Full Name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "signup" && (
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          )}

          {(localError || error) && (
            <p style={{ color: "var(--danger)", fontSize: "13px", fontWeight: 700 }}>{localError || error}</p>
          )}

          <Button type="submit" variant="success" size="lg" isLoading={isLoading}>
            {mode === "login" ? "Login and Continue" : "Create Account and Continue"}
          </Button>

          <Button type="button" variant="ghost" size="md" onClick={() => void backToIdScan()}>
            Back to ID Scan
          </Button>
        </form>
      </div>
    </div>
  );
}
