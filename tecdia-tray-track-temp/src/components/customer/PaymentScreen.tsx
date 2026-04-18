"use client";

import { useMemo } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

/**
 * Payment Options step — no emojis, clean text labels.
 */
export default function PaymentScreen() {
  const {
    employee,
    scannedItems,
    paymentMethod,
    selectPayment,
    confirmPayment,
    isLoading,
  } = useCustomerFlow();

  const total = useMemo(
    () => scannedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [scannedItems]
  );

  const options: { method: PaymentMethod; title: string; desc: string }[] = [
    {
      method: "immediate",
      title: "Pay Now",
      desc: "Complete payment immediately",
    },
    {
      method: "account",
      title: "Add to Account",
      desc: "Add to your monthly cafeteria bill",
    },
  ];

  return (
    <div
      className="animate-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        padding: "12px 24px 18px",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "36px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        Payment
      </h2>
      <p
        style={{
          fontSize: "16px",
          color: "var(--text-secondary)",
          marginBottom: "22px",
        }}
      >
        Total:{" "}
        <strong
          style={{
            color: "var(--accent)",
            fontFamily: "var(--font-mono)",
            fontSize: "20px",
          }}
        >
          {formatCurrency(total)}
        </strong>
      </p>

      {/* Payment Options */}
      <div className="flex gap-4 w-full mb-6" style={{ flexWrap: "wrap" }}>
        {options.map((opt) => {
          const isSelected = paymentMethod === opt.method;
          return (
            <button
              key={opt.method}
              onClick={() => selectPayment(opt.method)}
              style={{
                flex: "1 1 200px",
                padding: "28px 24px",
                borderRadius: "var(--radius-xl)",
                background: isSelected ? "rgba(94, 139, 58, 0.08)" : "var(--bg-elevated)",
                border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                cursor: "pointer",
                transition: "all 0.25s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
                boxShadow: isSelected ? "var(--shadow-glow)" : "var(--shadow-sm)",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                outline: "none",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: isSelected
                    ? "var(--accent)"
                    : "rgba(94, 139, 58, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: isSelected ? "white" : "var(--accent)",
                  transition: "all 0.25s ease",
                }}
              >
                {opt.method === "immediate" ? "Pay" : "Acc"}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    transition: "color 0.25s ease",
                  }}
                >
                  {opt.title}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  {opt.desc}
                </p>
              </div>
              {isSelected && (
                <div
                  className="animate-scale-pop"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Account balance info */}
      {paymentMethod === "account" && employee && (
        <div
          className="animate-fade-in"
          style={{
            width: "100%",
            background: "rgba(94, 139, 58, 0.06)",
            borderRadius: "var(--radius-xl)",
            padding: "20px 24px",
            border: "1px solid rgba(94, 139, 58, 0.15)",
            marginBottom: "24px",
          }}
        >
          <div className="flex items-center justify-between">
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Current account balance
            </p>
            <p
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatCurrency(employee.accountBalance)}
            </p>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginTop: "8px",
            }}
          >
            {formatCurrency(total)} will be added to your monthly cafeteria bill.
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <Button
        variant="success"
        size="xl"
        onClick={confirmPayment}
        isLoading={isLoading}
        disabled={!paymentMethod}
        className="w-full"
        style={{ fontSize: "18px", maxWidth: "400px" }}
      >
        Confirm Payment
      </Button>
    </div>
  );
}
