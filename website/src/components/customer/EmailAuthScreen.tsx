"use client";

import { useState } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmployeeIdScanPanel from "@/components/customer/EmployeeIdScanPanel";

export default function EmailAuthScreen() {
  const { signUpWithEmail, backToIdScan, isLoading, error, clearError } = useCustomerFlow();
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isScanningId, setIsScanningId] = useState(false);
  const [scannedIdHint, setScannedIdHint] = useState<string | null>(null);

  const handleEmployeeIdScan = (code: string) => {
    setEmployeeCode(code);
    setScannedIdHint(`Employee ID captured: ${code}`);
    setLocalError(null);
    if (error) clearError();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (error) clearError();

    const trimmedEmail = email.trim().toLowerCase();
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
    if (!trimmedEmail) {
      setLocalError("Email is required.");
      return;
    }

    await signUpWithEmail({
      employeeCode: employeeCode.trim().toUpperCase(),
      fullName: fullName.trim(),
      department: department.trim(),
      email: trimmedEmail,
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
        <h2
          style={{
            fontSize: "38px",
            fontWeight: 700,
            marginBottom: "8px",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          Create Account
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "18px", lineHeight: 1.7 }}>
          Scan your employee ID and complete your profile to start tray scanning.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <div
            style={{
              padding: "14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(109, 76, 64, 0.14)",
              background: "rgba(255, 251, 247, 0.72)",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Scan employee ID
            </p>
            <EmployeeIdScanPanel
              videoElementId="signup-id-scan-video"
              onScan={handleEmployeeIdScan}
              isScanning={isScanningId}
              onScanningChange={setIsScanningId}
              isLoading={isLoading}
              compact
              instruction="Scan your employee ID card or use a barcode scanner"
              scanButtonLabel="Scan Employee ID"
            />
          </div>

          <Input
            label="Employee ID"
            value={employeeCode}
            onChange={(event) => {
              setEmployeeCode(event.target.value);
              setScannedIdHint(null);
            }}
            placeholder="Enter or scan your employee ID"
            autoComplete="off"
          />
          {scannedIdHint && (
            <p style={{ margin: "-4px 0 0", fontSize: "13px", color: "var(--success)", fontWeight: 700 }}>
              {scannedIdHint}
            </p>
          )}
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
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
          />

          {(localError || error) && (
            <p style={{ color: "var(--danger)", fontSize: "13px", fontWeight: 700 }}>{localError || error}</p>
          )}

          <Button type="submit" variant="success" size="lg" isLoading={isLoading}>
            Create Account and Continue
          </Button>

          <Button type="button" variant="ghost" size="md" onClick={() => void backToIdScan()}>
            Back to ID Scan
          </Button>
        </form>
      </div>
    </div>
  );
}
