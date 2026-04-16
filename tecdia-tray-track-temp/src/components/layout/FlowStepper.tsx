"use client";

import { FLOW_STEP_LABELS } from "@/lib/constants";
import type { FlowStep } from "@/types";

/** Steps in display order — PROFILE removed */
const STEPS_ORDER: FlowStep[] = ["IDLE", "SCANNING", "RESULTS", "PAYMENT"];

interface FlowStepperProps {
  currentStep: FlowStep;
  compact?: boolean;
  embedded?: boolean;
}

/**
 * Horizontal step progress indicator using numbered circles.
 */
export default function FlowStepper({
  currentStep,
  compact = false,
  embedded = false,
}: FlowStepperProps) {
  const currentIdx = STEPS_ORDER.indexOf(currentStep);
  if (currentStep === "DONE") return null;

  return (
    <div
      className={embedded ? undefined : "editorial-surface"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: compact ? "0" : "18px 24px",
        margin: embedded ? "0" : "0 auto 22px",
        width: embedded ? "100%" : "min(100%, 840px)",
        minWidth: 0,
      }}
    >
      {STEPS_ORDER.map((step, idx) => {
        const info = FLOW_STEP_LABELS[step];
        const isActive = idx === currentIdx;
        const isCompleted = idx < currentIdx;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: compact ? 28 : 34,
                  height: compact ? 28 : 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: compact ? "12px" : "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  background: isActive
                    ? "linear-gradient(180deg, #171513 0%, #33302b 100%)"
                    : isCompleted
                      ? "var(--success)"
                      : "rgba(255,255,255,0.76)",
                  color:
                    isActive || isCompleted ? "white" : "var(--text-muted)",
                  boxShadow: isActive
                    ? "0 14px 24px rgba(23, 21, 19, 0.14)"
                    : "none",
                }}
              >
                {isCompleted ? "✓" : info.icon}
              </div>
              <span
                style={{
                  fontSize: compact ? "11px" : "12px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? "var(--text-primary)"
                    : isCompleted
                      ? "var(--success)"
                      : "var(--text-muted)",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {info.label}
              </span>
            </div>

            {idx < STEPS_ORDER.length - 1 && (
              <div
                style={{
                  width: compact ? "24px" : "32px",
                  height: "2px",
                  margin: compact ? "0 4px" : "0 6px",
                  borderRadius: "1px",
                  background: isCompleted
                    ? "var(--success)"
                    : "rgba(167, 156, 140, 0.22)",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
