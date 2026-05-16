"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";

/**
 * Admin layout — sidebar + content area.
 * Checks session auth and redirects to login if not authenticated.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) {
      return;
    }

    const isAuthed = sessionStorage.getItem("admin_auth") === "true";
    if (!isAuthed) {
      router.replace("/admin/login");
    }
  }, [isLoginRoute, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(187, 129, 105, 0.12), transparent 20%), radial-gradient(circle at bottom left, rgba(95, 126, 84, 0.1), transparent 18%), linear-gradient(180deg, #f5ede6 0%, #efe1d5 100%)",
      }}
    >
      <AdminSidebar />
      <main
        className="editorial-surface"
        style={{
          flex: 1,
          padding: "32px",
          margin: "18px 18px 18px 22px",
          overflow: "auto",
          borderRadius: "38px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
