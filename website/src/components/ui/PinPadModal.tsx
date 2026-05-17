"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onSubmit: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
  cancelLabel?: string;
}

/**
 * Six-digit PIN entry modal (numeric pad).
 */
export default function PinPadModal({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  submitLabel = "Confirm",
  cancelLabel = "Back",
}: PinPadModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setPin("");
    setError("");
    setShake(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pin.length !== 6) return;
    setSubmitting(true);
    setError("");
    const result = await onSubmit(pin);
    setSubmitting(false);
    if (result.ok) {
      reset();
      onClose();
      return;
    }
    setError(result.error || "Incorrect PIN.");
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {description && (
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
          {description}
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ direction: "ltr" }}>
        <div
          className={shake ? "animate-shake" : ""}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: i < pin.length ? "var(--accent)" : "var(--bg-elevated)",
                border: `2px solid ${i < pin.length ? "var(--accent)" : "var(--border)"}`,
                transition: "all 0.15s ease",
              }}
            />
          ))}
        </div>
        {error && (
          <p
            className="animate-slide-up"
            style={{
              color: "var(--danger)",
              fontSize: "13px",
              marginBottom: "16px",
              textAlign: "center",
            }}
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
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "Back"].map((key) =>
            key === "" ? (
              <div key="empty" />
            ) : (
              <button
                key={key}
                type="button"
                onClick={() => (key === "Back" ? handleBackspace() : handlePadPress(key))}
                className="btn btn-ghost"
                style={{
                  height: "52px",
                  fontSize: key === "Back" ? "14px" : "20px",
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
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="md" className="flex-1 pin-modal-back" onClick={handleClose}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="flex-1"
            disabled={pin.length < 6}
            isLoading={submitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
