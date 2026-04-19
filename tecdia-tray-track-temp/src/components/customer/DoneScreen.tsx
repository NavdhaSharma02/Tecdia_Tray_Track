"use client";

import { useEffect, useState } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DONE_REDIRECT_MS } from "@/lib/constants";

/**
 * Done/Receipt step — shows success animation and receipt summary.
 */
export default function DoneScreen() {
  const { receipt, reset } = useCustomerFlow();
  const [countdown, setCountdown] = useState(Math.ceil(DONE_REDIRECT_MS / 1000));
  const [isPrinting, setIsPrinting] = useState(false);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (isPrinting) {
          return prev;
        }

        if (prev <= 1) {
          clearInterval(timer);
          void reset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPrinting, reset]);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const handlePrintBill = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => {
      setIsPrinting(false);
    }, 300);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 24px 18px",
        minHeight: "100%",
      }}
    >
      {/* Success animation */}
      <div className="animate-scale-pop" style={{ marginBottom: "24px" }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "var(--success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px var(--success-glow), 0 0 80px var(--success-glow)",
          }}
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M5 13l4 4L19 7"
              style={{
                strokeDasharray: 30,
                strokeDashoffset: 0,
                animation: "check-draw 0.5s ease-out 0.3s both",
              }}
            />
          </svg>
        </div>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "36px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        Payment Successful!
      </h2>

      <p
        style={{
          fontSize: "16px",
          color: "var(--text-secondary)",
          marginBottom: "32px",
        }}
      >
        Thank you for your meal. Enjoy!
      </p>

      {/* Receipt Card */}
      {receipt && (
        <Card variant="glass" className="w-full max-w-[450px] mb-8 border-glow animate-slide-up">
          <div
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "16px",
              marginBottom: "16px",
            }}
          >
            <div className="flex items-center justify-between">
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Transaction ID</p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--accent-light)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {receipt.transactionId}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Date</p>
              <p style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                {formatDateTime(receipt.date)}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Payment Method</p>
              <p style={{ fontSize: "14px", color: "var(--text-primary)", textTransform: "capitalize" }}>
                {receipt.paymentMethod === "account" ? "Monthly Account" : "Paid Now"}
              </p>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: "16px" }}>
            {receipt.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between"
                style={{ padding: "6px 0" }}
              >
                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  {item.name} × {item.quantity}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "16px",
            }}
          >
            <div className="flex items-center justify-between">
              <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                Total
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--success)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {formatCurrency(receipt.total)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Auto-redirect */}
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          marginBottom: "16px",
        }}
      >
        {isPrinting ? (
          "Print dialog open. Auto-return is paused."
        ) : (
          <>
            Returning to home in{" "}
            <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>
              {countdown}s
            </span>
          </>
        )}
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <Button variant="primary" size="lg" onClick={handlePrintBill}>
          Print Bill
        </Button>
        <Button variant="outline" size="lg" onClick={() => void reset()}>
          Done
        </Button>
      </div>
    </div>
  );
}
