"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import TecdiaLogo from "@/components/layout/TecdiaLogo";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/menu", label: "Menu Items" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/feedbacks", label: "Feedbacks" },
  { href: "/admin/analytics", label: "Analytics" },
];

/**
 * Admin sidebar navigation — text labels, no emojis.
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleCustomerView = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors and still redirect
    }
    sessionStorage.removeItem("admin_auth");
    router.push("/customer");
  };

  return (
    <aside className="sidebar" style={{ display: "flex", flexDirection: "column", margin: "18px 0 18px 18px", borderRadius: "34px", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/admin"
          className="flex items-center gap-3"
          style={{ textDecoration: "none" }}
        >
          <TecdiaLogo size="sm" align="left" />
          <div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              {APP_NAME}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("sidebar-link", isActive && "active")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={handleCustomerView}
          className="btn btn-outline btn-sm w-full"
          style={{ fontSize: "13px", cursor: "pointer" }}
        >
          Customer View
        </button>
      </div>
    </aside>
  );
}
