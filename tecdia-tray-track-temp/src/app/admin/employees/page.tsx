"use client";

import EmployeeManagementTable from "@/components/admin/EmployeeManagementTable";
import Card from "@/components/ui/Card";

export default function AdminEmployeesPage() {
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
          Employee Management
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          Track employees who make cafeteria transactions and monitor their billing activity
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
              Purpose
            </p>
            <p style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 600 }}>
              Keep a record of employees who transact, their balances, payment behavior, and recent activity.
            </p>
          </div>
          <div>
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>
              Operational View
            </p>
            <p style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 600 }}>
              Helps admins and cashiers quickly identify active diners, outstanding balances, and dormant accounts.
            </p>
          </div>
        </div>
      </Card>

      <EmployeeManagementTable />
    </div>
  );
}
