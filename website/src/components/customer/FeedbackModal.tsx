"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import * as api from "@/services/api";
import type { CustomerTransactionSummary } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmitted,
}: FeedbackModalProps) {
  const [issueText, setIssueText] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  const [transactions, setTransactions] = useState<CustomerTransactionSummary[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIssueText("");
    setSelectedTransactionId("");
    setError(null);
    setIsLoadingTransactions(true);

    api
      .getCustomerTransactions()
      .then((result) => {
        if (!result.ok || !result.data) {
          setError(result.error || "Could not load past transactions.");
          setTransactions([]);
          return;
        }
        setTransactions(result.data);
      })
      .finally(() => {
        setIsLoadingTransactions(false);
      });
  }, [isOpen]);

  const transactionOptions = useMemo(() => {
    return transactions.map((transaction) => ({
      id: transaction.id,
      label: `${transaction.id.slice(0, 8)} • ${formatCurrency(
        transaction.total
      )} • ${formatDateTime(transaction.date)}`,
    }));
  }, [transactions]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const feedbackText = issueText.trim();
    if (!feedbackText) {
      setError("Please enter your feedback before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await api.submitCustomerFeedback({
      issueText: feedbackText,
      transactionId: selectedTransactionId || null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error || "Could not submit feedback.");
      return;
    }

    await onSubmitted();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Feedback">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Tell us what issue you faced. You can optionally link this feedback to a past
          transaction.
        </p>

        <div className="flex flex-col gap-2">
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Related Transaction (optional)
          </label>
          <select
            className="input"
            value={selectedTransactionId}
            onChange={(event) => setSelectedTransactionId(event.target.value)}
            disabled={isLoadingTransactions || isSubmitting}
          >
            <option value="">General feedback (no transaction)</option>
            {transactionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Issue / Feedback
          </label>
          <textarea
            value={issueText}
            onChange={(event) => setIssueText(event.target.value)}
            placeholder="Describe the issue or suggestion..."
            rows={5}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: "14px",
              resize: "vertical",
            }}
            disabled={isSubmitting}
          />
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}

        <div className="flex gap-3 mt-1">
          <Button type="button" variant="outline" size="md" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="flex-1">
            Submit Feedback
          </Button>
        </div>
      </form>
    </Modal>
  );
}
