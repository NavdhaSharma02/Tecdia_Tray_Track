"use client";

import MenuEditor from "@/components/admin/MenuEditor";

/**
 * Admin — Menu Management page.
 */
export default function AdminMenuPage() {
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
          Menu Management
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          Add, edit, and manage cafeteria menu items
        </p>
      </div>
      <MenuEditor />
    </div>
  );
}
