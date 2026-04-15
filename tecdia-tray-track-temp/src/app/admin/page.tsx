"use client";

import StatsGrid from "@/components/admin/StatsGrid";

/**
 * Admin dashboard — overview with stat cards.
 */
export default function AdminDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          Overview of today&apos;s cafeteria operations
        </p>
      </div>
      <StatsGrid />
    </div>
  );
}
