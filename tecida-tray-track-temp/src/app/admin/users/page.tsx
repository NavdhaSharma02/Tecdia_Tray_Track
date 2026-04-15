"use client";

import UserTable from "@/components/admin/UserTable";

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
          User Management
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          View and manage employee accounts
        </p>
      </div>
      <UserTable />
    </div>
  );
}
