"use client";

import { useState } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import * as api from "@/services/api";

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
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPin, setResetPin] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

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
      if (!employeeCode.trim()) {
        setLocalError("Employee ID is required for signup.");
        return;
      }
      if (!fullName.trim()) {
        setLocalError("Full name is required for signup.");
        return;
      }
      if (!department.trim()) {
        setLocalError("Department is required for signup.");
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
        employeeCode: employeeCode.trim().toUpperCase(),
        fullName: fullName.trim(),
        department: department.trim(),
        email: trimmedEmail,
        password,
      });
      return;
    }

    await loginWithEmail({ email: trimmedEmail, password });
  };

  const openResetModal = () => {
    setShowResetModal(true);
    setResetPin("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError(null);
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setResetError("Enter your email first.");
      return;
    }
    if (!/^\d{6}$/.test(resetPin.trim())) {
      setResetError("Admin PIN must be exactly 6 digits.");
      return;
    }
    if (resetNewPassword.length < 8) {
      setResetError("New password must be at least 8 characters.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setIsResetting(true);
    const result = await api.resetCustomerPassword({
      email: trimmedEmail,
      adminPin: resetPin.trim(),
      newPassword: resetNewPassword,
    });
    setIsResetting(false);
    if (!result.ok) {
      setResetError(result.error || "Could not reset password.");
      return;
    }
    setShowResetModal(false);
    setLocalError("Password reset successful. You can now log in.");
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
            <>
              <Input
                label="Employee ID"
                value={employeeCode}
                onChange={(event) => setEmployeeCode(event.target.value)}
                placeholder="Enter your employee ID"
                autoComplete="off"
              />
              <Input
                label="Department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                placeholder="Enter your department"
                autoComplete="organization"
              />
              <Input
                label="Full Name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </>
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

          {mode === "login" && (
            <Button type="button" variant="outline" size="md" onClick={openResetModal}>
              Forgot Password? Reset with Admin PIN
            </Button>
          )}

          <Button type="button" variant="ghost" size="md" onClick={() => void backToIdScan()}>
            Back to ID Scan
          </Button>
        </form>
      </div>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Password (Admin Authorized)"
      >
        <form onSubmit={handleResetPassword} style={{ display: "grid", gap: "12px" }}>
          <Input
            label="Admin PIN"
            value={resetPin}
            onChange={(event) =>
              setResetPin(event.target.value.replace(/[^\d]/g, "").slice(0, 6))
            }
            placeholder="6-digit PIN"
            inputMode="numeric"
            autoComplete="off"
          />
          <Input
            label="New Password"
            type="password"
            value={resetNewPassword}
            onChange={(event) => setResetNewPassword(event.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={resetConfirmPassword}
            onChange={(event) => setResetConfirmPassword(event.target.value)}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />
          {resetError && (
            <p style={{ fontSize: "13px", color: "var(--danger)", fontWeight: 700 }}>
              {resetError}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1" isLoading={isResetting}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
