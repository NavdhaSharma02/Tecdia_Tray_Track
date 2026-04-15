"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import TecdiaLogo from "@/components/layout/TecdiaLogo";

interface HeaderProps {
  showAdmin?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * App header with logo, live clock, and admin link.
 */
export default function Header({
  showAdmin = true,
  showBack = false,
  onBack,
}: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 14,
        left: 18,
        right: 18,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        background: "rgba(255, 251, 245, 0.66)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--border)",
        borderRadius: "999px",
        boxShadow: "0 16px 32px rgba(44, 35, 23, 0.08)",
      }}
    >
      <div className="flex items-center gap-3">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="btn btn-ghost btn-sm"
            style={{ marginRight: "8px" }}
          >
            Back
          </button>
        )}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <TecdiaLogo size="sm" align="left" showLines={false} />
          <span
            style={{
              fontSize: "19px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-display)",
            }}
          >
            {APP_NAME}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--text-secondary)",
            background: "rgba(255,255,255,0.58)",
            padding: "8px 14px",
            borderRadius: "999px",
          }}
        >
          {time}
        </span>
        {showAdmin && (
          <Link
            href="/admin/login"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "13px" }}
          >
            Admin
          </Link>
        )}
      </div>
    </header>
  );
}
