"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import TecdiaLogo from "@/components/layout/TecdiaLogo";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/menu", label: "Menu Items" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/analytics", label: "Analytics" },
];

/**
 * Admin sidebar navigation — text labels, no emojis.
 */
export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" style={{ display: "flex", flexDirection: "column", margin: "18px 0 18px 18px", borderRadius: "34px", boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
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
              }}
            >
              {APP_NAME}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
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
        <Link
          href="/customer"
          className="btn btn-outline btn-sm w-full"
          style={{ fontSize: "13px", textDecoration: "none" }}
        >
          Customer View
        </Link>
      </div>
    </aside>
  );
}
