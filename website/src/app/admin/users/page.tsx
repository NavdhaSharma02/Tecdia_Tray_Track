"use client";

import UserTable from "@/components/admin/UserTable";
import Card from "@/components/ui/Card";

/**
 * Admin — User Management page.
 */
export default function AdminUsersPage() {
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
          User Access
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          Manage admins and cashiers with different access levels
        </p>
      </div>
      <Card variant="glass" className="mb-6">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
              Admin Access
            </p>
            <p style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 600 }}>
              Full visibility into analytics, menu control, users, employees, and transactions.
            </p>
          </div>
          <div>
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
              Cashier Access
            </p>
            <p style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 600 }}>
              Focused access for handling payments, account balances, receipts, and transaction support.
            </p>
          </div>
        </div>
      </Card>
      <UserTable />
    </div>
  );
}
