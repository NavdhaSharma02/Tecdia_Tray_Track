"use client";

import { FLOW_STEP_LABELS } from "@/lib/constants";
import type { FlowStep } from "@/types";

/** Steps shown in the header (identify covers IDLE + EMAIL_AUTH) */
const STEPS_ORDER: FlowStep[] = ["IDLE", "SCANNING", "BILL", "PAYMENT"];

function displayStepIndex(step: FlowStep): number {
  if (step === "EMAIL_AUTH" || step === "PROFILE") {
    return STEPS_ORDER.indexOf("IDLE");
  }
  return STEPS_ORDER.indexOf(step);
}

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
  const currentIdx = displayStepIndex(currentStep);
  if (currentStep === "DONE") return null;

  return (
    <div
      className={embedded ? undefined : "editorial-surface"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: compact ? "0" : "20px 26px",
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
                  width: compact ? 32 : 38,
                  height: compact ? 32 : 38,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: compact ? "13px" : "15px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  background: isActive
                    ? "linear-gradient(180deg, #1b1512 0%, #332721 100%)"
                    : isCompleted
                      ? "var(--success)"
                      : embedded
                        ? "rgba(255, 255, 255, 0.72)"
                        : "rgba(255,251,248,0.82)",
                  color:
                    isActive || isCompleted
                      ? "white"
                      : embedded
                        ? "rgba(31, 21, 17, 0.9)"
                        : "var(--text-muted)",
                  boxShadow: isActive
                    ? "0 14px 24px rgba(24, 17, 14, 0.16)"
                    : "none",
                  border:
                    embedded && !isActive && !isCompleted
                      ? "1px solid rgba(109, 76, 64, 0.14)"
                      : "none",
                }}
              >
                {isCompleted ? "✓" : info.icon}
              </div>
              <span
                style={{
                  fontSize: compact ? "12px" : "13px",
                  fontWeight: isActive ? 700 : 600,
                  lineHeight: 1,
                  color: isActive
                    ? embedded
                      ? "#1f1511"
                      : "var(--text-primary)"
                    : isCompleted
                      ? "var(--success)"
                    : embedded
                        ? "rgba(31, 21, 17, 0.78)"
                        : "var(--text-muted)",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  transform: compact ? "scale(1.06)" : "none",
                  transformOrigin: "left center",
                }}
              >
                {info.label}
              </span>
            </div>

            {idx < STEPS_ORDER.length - 1 && (
              <div
                style={{
                  width: compact ? "28px" : "36px",
                  height: "2px",
                  margin: compact ? "0 4px" : "0 8px",
                  borderRadius: "1px",
                  background: isCompleted
                    ? "var(--success)"
                    : embedded
                      ? "rgba(109, 76, 64, 0.18)"
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
