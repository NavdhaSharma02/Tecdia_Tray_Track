"use client";

import MenuEditor from "@/components/admin/MenuEditor";

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
          Menu Items
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          Manage today&apos;s cafeteria menu and reference photos for tray scanning
        </p>
      </div>
      <MenuEditor />
    </div>
  );
}
