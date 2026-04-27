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
        padding: "16px 28px 22px",
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <span className="app-shell-eyebrow" style={{ marginBottom: "16px" }}>
        Final step
      </span>
      <h2
        style={{
          fontSize: "clamp(2.35rem, 4.4vw, 3.2rem)",
          fontWeight: 700,
          color: "#ffffff",
          marginBottom: "8px",
          textShadow: "0 10px 26px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.28)",
        }}
      >
        Payment
      </h2>
      <p
        style={{
          fontSize: "17px",
          color: "#ffffff",
          marginBottom: "22px",
          fontWeight: 700,
          textShadow: "0 10px 26px rgba(0,0,0,0.36), 0 2px 8px rgba(0,0,0,0.22)",
        }}
      >
        Total:{" "}
        <strong
          style={{
            color: "#ffffff",
            fontFamily: "var(--font-mono)",
            fontSize: "22px",
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
                flex: "1 1 220px",
                padding: "32px 28px",
                borderRadius: "28px",
                background: isSelected
                  ? "linear-gradient(180deg, rgba(95, 126, 84, 0.1), rgba(255, 251, 247, 0.92))"
                  : "linear-gradient(180deg, rgba(255, 251, 247, 0.92), rgba(248, 238, 231, 0.84))",
                border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                cursor: "pointer",
                transition: "all 0.25s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
                textAlign: "center",
                boxShadow: isSelected ? "var(--shadow-glow)" : "var(--shadow-md)",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                outline: "none",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: isSelected
                    ? "linear-gradient(180deg, #1b1512 0%, #332721 100%)"
                    : "rgba(43, 29, 24, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: isSelected ? "white" : "var(--accent-deep)",
                  transition: "all 0.25s ease",
                }}
              >
                {opt.method === "immediate" ? "Pay" : "Acc"}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    transition: "color 0.25s ease",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {opt.title}
                </p>
                <p
                  style={{
                    fontSize: "14px",
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
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(180deg, #1b1512 0%, #332721 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "16px",
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
            background: "linear-gradient(180deg, rgba(255, 251, 247, 0.92), rgba(242, 247, 238, 0.9))",
            borderRadius: "28px",
            padding: "24px 28px",
            border: "1px solid rgba(95, 126, 84, 0.15)",
            marginBottom: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between">
              <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
              Current account balance
            </p>
            <p
              style={{
                fontSize: "22px",
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
              fontSize: "14px",
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
        variant="outline"
        size="xl"
        onClick={confirmPayment}
        isLoading={isLoading}
        disabled={!paymentMethod}
        className="w-full btn-scan-action"
        style={{ fontSize: "19px", maxWidth: "440px" }}
      >
        Confirm Payment
      </Button>
    </div>
  );
}
