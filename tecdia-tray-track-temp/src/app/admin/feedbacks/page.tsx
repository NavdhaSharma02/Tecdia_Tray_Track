"use client";

import FeedbackTable from "@/components/admin/FeedbackTable";

export default function AdminFeedbacksPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Feedbacks
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          View customer issues and product improvement suggestions.
        </p>
      </div>
      <FeedbackTable />
    </div>
  );
}
