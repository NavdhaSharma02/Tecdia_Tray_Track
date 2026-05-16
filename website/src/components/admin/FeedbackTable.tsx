"use client";

import { useEffect, useState } from "react";
import * as api from "@/services/api";
import type { FeedbackEntry } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function FeedbackTable() {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAdminFeedbacks()
      .then((result) => {
        if (!result.ok || !result.data) {
          setError(result.error || "Could not load feedbacks.");
          setFeedbacks([]);
          return;
        }
        setFeedbacks(result.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Submitted At</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Transaction</th>
            <th>Issue</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <tr key={idx}>
                <td colSpan={5}>
                  <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                </td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={5} style={{ color: "var(--danger)", textAlign: "center", padding: "24px" }}>
                {error}
              </td>
            </tr>
          ) : feedbacks.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>
                No feedback submitted yet.
              </td>
            </tr>
          ) : (
            feedbacks.map((feedback) => (
              <tr key={feedback.id}>
                <td style={{ color: "var(--text-secondary)" }}>
                  {formatDateTime(feedback.createdAt)}
                </td>
                <td>{feedback.customerName}</td>
                <td style={{ color: "var(--text-secondary)" }}>{feedback.customerEmail}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                  {feedback.transactionId || "General"}
                </td>
                <td style={{ maxWidth: "520px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {feedback.issueText}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
