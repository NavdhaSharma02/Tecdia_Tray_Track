"use client";

import { useState, useEffect, useRef } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type AuthMode = "signup" | "login";

export default function EmailAuthScreen() {
  const { signUpWithEmail, loginWithEmail, backToIdScan, isLoading, error, clearError } = useCustomerFlow();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedIdHint, setScannedIdHint] = useState<string | null>(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const barcodeBufferRef = useRef("");

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    if (error) clearError();
    setIsScanning(false);
  };

  const handleScanClick = () => {
    barcodeBufferRef.current = "";
    setBarcodeBuffer("");
    setIsScanning(true);
    setScannedIdHint(null);
    setLocalError(null);
    if (error) clearError();
  };

  // Keyboard handler for laser scanner
  useEffect(() => {
    if (!isScanning) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const code = barcodeBufferRef.current.trim();
        if (!code) return;
        event.preventDefault();
        setEmployeeCode(code);
        setScannedIdHint(`Employee ID captured: ${code}`);
        barcodeBufferRef.current = "";
        setBarcodeBuffer("");
        setIsScanning(false);
        return;
      }

      if (event.key === "Escape") {
        barcodeBufferRef.current = "";
        setBarcodeBuffer("");
        setIsScanning(false);
        return;
      }

      if (/^[a-zA-Z0-9_-]$/.test(event.key)) {
        barcodeBufferRef.current += event.key;
        setBarcodeBuffer(barcodeBufferRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isScanning]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    barcodeBufferRef.current = "";
    setBarcodeBuffer("");
    setIsScanning(false);
    setLocalError(null);
    if (error) clearError();

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setLocalError("Email is required.");
      return;
    }
    if (!trimmedPassword) {
      setLocalError("Password is required.");
      return;
    }
    if (trimmedPassword.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    if (mode === "login") {
      await loginWithEmail({ email: trimmedEmail, password: trimmedPassword });
      return;
    }

    if (!employeeCode.trim()) {
      setLocalError("Employee ID is required.");
      return;
    }
    if (!fullName.trim()) {
      setLocalError("Full name is required.");
      return;
    }
    if (!department.trim()) {
      setLocalError("Department is required.");
      return;
    }

    await signUpWithEmail({
      employeeCode: employeeCode.trim().toUpperCase(),
      fullName: fullName.trim(),
      department: department.trim(),
      email: trimmedEmail,
      password: trimmedPassword,
    });
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
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <Button
            type="button"
            variant={mode === "signup" ? "primary" : "ghost"}
            size="md"
            onClick={() => switchMode("signup")}
          >
            Create account
          </Button>
          <Button
            type="button"
            variant={mode === "login" ? "primary" : "ghost"}
            size="md"
            onClick={() => switchMode("login")}
          >
            Log in
          </Button>
        </div>

        <h2
          style={{
            fontSize: "38px",
            fontWeight: 700,
            marginBottom: "8px",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {mode === "signup" ? "Create Account" : "Sign In"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "18px", lineHeight: 1.7 }}>
          {mode === "signup"
            ? "Scan your employee ID and complete your profile to start tray scanning."
            : "Use your email and password to access your customer account."}
        </p>

        {mode === "signup" && (
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 6",
              maxHeight: "min(32vh, 320px)",
              borderRadius: "20px",
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,238,231,0.52))",
              border: "2px solid rgba(109, 76, 64, 0.16)",
              boxShadow: "var(--shadow-md)",
              marginBottom: "20px",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            <div className="id-scanner-visual id-scanner-visual--compact" aria-hidden="true">
              <div className="id-scanner-card">
                <div className="id-scanner-card__chip" />
                <div className="id-scanner-card__photo" />
                <div className="id-scanner-card__lines">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="id-scanner-barcode">
                  {[12, 7, 18, 9, 14, 6, 20, 8, 16, 10, 5, 18].map((width, index) => (
                    <span key={index} style={{ width: `${width}px` }} />
                  ))}
                </div>
              </div>
              <div className="id-scanner-laser" />
              <div className="id-scanner-glow" />
            </div>

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                pointerEvents: "none",
                zIndex: 10,
                padding: "0 18px 12px",
              }}
            >
              <div
                style={{
                  padding: isScanning ? "10px 14px 12px" : "10px 18px",
                  background: "rgba(255, 251, 247, 0.78)",
                  backdropFilter: "blur(10px)",
                  borderRadius: isScanning ? "18px" : "var(--radius-full)",
                  border: "1px solid rgba(109, 76, 64, 0.14)",
                  minWidth: isScanning ? "min(320px, 72vw)" : "auto",
                  boxShadow: "0 18px 42px rgba(67, 41, 33, 0.12)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#231712",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  {isScanning ? "Reading employee ID..." : "Ready to scan"}
                </p>
                {isScanning && (
                  <div
                    style={{
                      height: "8px",
                      marginTop: "10px",
                      overflow: "hidden",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(109, 76, 64, 0.1)",
                      border: "1px solid rgba(109, 76, 64, 0.12)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "inherit",
                        background:
                          "linear-gradient(90deg, var(--accent), var(--success), var(--accent-light))",
                        boxShadow: "0 0 18px var(--accent-glow)",
                        transformOrigin: "left",
                        animation: "scan-progress-fill 1.8s ease-in-out infinite",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          {mode === "signup" && (
            <>
              <div style={{ display: "flex", gap: "8px" }}>
                <Input
                  label="Employee ID"
                  value={employeeCode}
                  onChange={(event) => {
                    setIsScanning(false);
                    barcodeBufferRef.current = "";
                    setBarcodeBuffer("");
                    setEmployeeCode(event.target.value);
                    setScannedIdHint(null);
                  }}
                  placeholder="Enter or scan your ID"
                  autoComplete="off"
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  variant={isScanning ? "success" : "outline"}
                  size="md"
                  onClick={handleScanClick}
                  style={{
                    marginTop: "auto",
                    minWidth: "100px",
                  }}
                >
                  {isScanning ? "Scanning..." : "Scan ID"}
                </Button>
              </div>
              {scannedIdHint && (
                <p style={{ margin: "-4px 0 0", fontSize: "13px", color: "var(--success)", fontWeight: 700 }}>
                  {scannedIdHint}
                </p>
              )}
              <Input
                label="Department"
                value={department}
                onChange={(event) => {
                  setIsScanning(false);
                  setDepartment(event.target.value);
                }}
                placeholder="Enter your department"
                autoComplete="organization"
              />
              <Input
                label="Full Name"
                value={fullName}
                onChange={(event) => {
                  setIsScanning(false);
                  setFullName(event.target.value);
                }}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => {
              setIsScanning(false);
              setEmail(event.target.value);
            }}
            placeholder="name@example.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => {
              setIsScanning(false);
              setPassword(event.target.value);
            }}
            placeholder="At least 8 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {(localError || error) && (
            <p style={{ color: "var(--danger)", fontSize: "13px", fontWeight: 700 }}>{localError || error}</p>
          )}

          <Button type="submit" variant="success" size="lg" isLoading={isLoading}>
            {mode === "signup" ? "Create Account and Continue" : "Sign In"}
          </Button>

          <Button type="button" variant="ghost" size="md" onClick={() => void backToIdScan()}>
            Back to ID Scan
          </Button>
        </form>
      </div>
    </div>
  );
}
