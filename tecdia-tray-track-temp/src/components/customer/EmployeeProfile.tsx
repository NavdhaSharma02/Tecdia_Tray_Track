"use client";

import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils";

/**
 * Employee Profile step — warm card design with account info and meal history.
 */
export default function EmployeeProfile() {
  const { employee, transactions, startScan, reset } = useCustomerFlow();

  if (!employee) return null;

  return (
    <div
      className="animate-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px",
        maxWidth: "700px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Employee Card */}
      <div
        style={{
          width: "100%",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-xl)",
          padding: "28px",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border)",
          marginBottom: "20px",
        }}
      >
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
              boxShadow: "var(--shadow-glow)",
            }}
          >
            {getInitials(employee.name)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {employee.name}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="accent">{employee.department}</Badge>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {employee.id}
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              {employee.email}
            </p>
          </div>
        </div>
      </div>

      {/* Account Balance */}
      <div
        style={{
          width: "100%",
          background: "rgba(94, 139, 58, 0.06)",
          borderRadius: "var(--radius-xl)",
          padding: "24px 28px",
          border: "1px solid rgba(94, 139, 58, 0.15)",
          marginBottom: "20px",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Account Balance
            </p>
            <p
              style={{
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatCurrency(employee.accountBalance)}
            </p>
          </div>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            💰
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div
          style={{
            width: "100%",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            marginBottom: "28px",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
              Recent Meals
            </h3>
          </div>
          <div>
            {transactions.slice(0, 3).map((txn, idx) => (
              <div
                key={txn.id}
                className={`animate-slide-in-right stagger-${idx + 1}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: idx < Math.min(transactions.length, 3) - 1
                    ? "1px solid var(--border)"
                    : "none",
                  opacity: 0,
                }}
              >
                <div>
                  <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>
                    {txn.items.map((i) => i.name).join(", ")}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {formatDateTime(txn.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={txn.paymentMethod === "account" ? "warning" : "success"}>
                    {txn.paymentMethod === "account" ? "Account" : "Paid"}
                  </Badge>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatCurrency(txn.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 w-full">
        <Button
          variant="outline"
          size="lg"
          onClick={reset}
          className="flex-1"
        >
          ← Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={startScan}
          className="flex-[2]"
          style={{ fontSize: "18px" }}
        >
          📷 Scan My Tray
        </Button>
      </div>
    </div>
  );
}
