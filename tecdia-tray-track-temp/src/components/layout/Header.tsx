"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import TecdiaLogo from "@/components/layout/TecdiaLogo";
import FlowStepper from "@/components/layout/FlowStepper";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";

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
  const { step } = useCustomerFlow();
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
        top: 10,
        left: 14,
        right: 14,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        background: "rgba(255, 245, 240, 0.58)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        borderRadius: "999px",
        boxShadow: "0 12px 24px rgba(86, 42, 34, 0.1)",
      }}
    >
      <div className="flex items-center gap-2">
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
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <TecdiaLogo size="sm" align="left" showLines={false} />
          <span
            style={{
              fontSize: "17px",
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

      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(100%, 470px)",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <FlowStepper currentStep={step} compact embedded />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-secondary)",
            background: "rgba(255, 248, 244, 0.68)",
            padding: "6px 11px",
            borderRadius: "999px",
          }}
        >
          {time}
        </span>
        {showAdmin && (
          <Link
            href="/admin/login"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "12px" }}
          >
            Admin
          </Link>
        )}
      </div>
    </header>
  );
}
