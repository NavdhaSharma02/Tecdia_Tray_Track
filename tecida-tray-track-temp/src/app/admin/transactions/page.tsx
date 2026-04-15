"use client";

import TransactionTable from "@/components/admin/TransactionTable";

/**
 * Admin — Transaction History page.
 */
export default function AdminTransactionsPage() {
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
          Transaction History
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          View all cafeteria transactions
        </p>
      </div>
      <TransactionTable />
    </div>
  );
}
