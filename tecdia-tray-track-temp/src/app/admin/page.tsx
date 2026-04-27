"use client";

import StatsGrid from "@/components/admin/StatsGrid";

/**
 * Admin dashboard — overview with stat cards.
 */
export default function AdminDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <span className="app-shell-eyebrow">Operations overview</span>
        <h1 className="app-shell-heading" style={{ marginTop: "14px" }}>
          Dashboard
        </h1>
        <p className="app-shell-subtitle" style={{ marginTop: "8px" }}>
          Overview of today&apos;s cafeteria operations
        </p>
      </div>
      <StatsGrid />
    </div>
  );
}
