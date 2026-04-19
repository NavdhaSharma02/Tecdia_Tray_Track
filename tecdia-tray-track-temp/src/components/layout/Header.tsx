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
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__brand">
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

        <div className="app-header__stepper">
          <FlowStepper currentStep={step} compact embedded />
        </div>

        <div className="app-header__actions">
          <span className="app-header__time">{time}</span>
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
      </div>
    </header>
  );
}
