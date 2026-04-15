"use client";

import { useEffect, useState } from "react";
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
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthed(true);
      return;
    }

    const isAuth = sessionStorage.getItem("admin_auth");
    if (!isAuth) {
      router.replace("/admin/login");
    } else {
      setAuthed(true);
      sessionStorage.removeItem("admin_auth");
    }
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!authed) return null;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(171, 205, 120, 0.18), transparent 18%), radial-gradient(circle at bottom left, rgba(238, 190, 116, 0.18), transparent 18%), linear-gradient(180deg, #f7f3ea 0%, #edf1e6 100%)",
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
        }}
      >
        {children}
      </main>
    </div>
  );
}
