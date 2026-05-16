"use client";

import { useState, useEffect, useCallback } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import { useCamera } from "@/hooks/useCamera";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const DEMO_EMPLOYEE_IDS = ["EMP-001", "EMP-002", "EMP-003", "EMP-004", "EMP-005"];

export default function IdleScreenEditorial() {
  const { identifyEmployee, openEmailAuth, isLoading, error, clearError } = useCustomerFlow();
  const { videoRef, isReady, error: camError, start, stop, captureFrame } = useCamera();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    if (error) clearError();

    try {
      try {
        await captureFrame();
      } catch {
        // Keep the demo scan flow resilient when frame capture fails.
      }

      await new Promise((r) => setTimeout(r, 1800));
      const scannedId =
        DEMO_EMPLOYEE_IDS[Math.floor(Math.random() * DEMO_EMPLOYEE_IDS.length)];

      await identifyEmployee(scannedId);
    } catch {
      // Shared flow state surfaces the user-facing error.
    } finally {
      setIsScanning(false);
    }
  }, [captureFrame, identifyEmployee, error, clearError]);

  return (
    <div
      className="animate-fade-in customer-hero customer-hero--idle"
      style={{
        width: "100%",
      }}
    >
      <section
        style={{
          padding: "0",
          display: "grid",
          gap: "14px",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          backdropFilter: "none",
        }}
      >
        <div style={{ display: "grid", gap: "10px" }}>
          <div>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 0.96,
                margin: "0 0 10px",
                textShadow: "0 10px 26px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.28)",
              }}
            >
              Scan your ID to begin your dining session
            </h2>
            <p
              style={{
                display: "inline-flex",
                width: "fit-content",
                maxWidth: "100%",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.72)",
                border: "1px solid rgba(109, 76, 64, 0.12)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#1f1511",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textShadow: "none",
              }}
            >
              Hold your employee ID card in front of the camera to continue
            </p>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 5.8",
            maxHeight: "min(48vh, 460px)",
            borderRadius: "32px",
            overflow: "hidden",
            background: "linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,238,231,0.52))",
            border: `2px solid ${isScanning ? "var(--accent)" : "rgba(109, 76, 64, 0.16)"}`,
            boxShadow: isScanning ? "var(--shadow-glow)" : "var(--shadow-md)",
            backdropFilter: "blur(12px)",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
        >
          {camError ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "14px",
                padding: "28px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Camera
              </p>
              <p style={{ margin: 0, color: "#ffd3d3", fontWeight: 800, textTransform: "uppercase" }}>
                Camera Not Available
              </p>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.84)",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                {camError}
              </p>
              <Button variant="outline" size="md" onClick={start}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              {!isReady && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    zIndex: 15,
                    background: "rgba(255, 251, 247, 0.5)",
                  }}
                >
                  <Spinner size={36} />
                  <p
                    style={{
                      margin: 0,
                      color: "#ffffff",
                      fontSize: "15px",
                      textTransform: "uppercase",
                      fontWeight: 800,
                      letterSpacing: "0.03em",
                    }}
                  >
                    Starting camera...
                  </p>
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  background: "var(--bg-primary)",
                  transform: "scaleX(-1)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: "74%",
                    height: "60%",
                    position: "relative",
                  }}
                >
                  {[
                    { top: 0, left: 0, borderTop: "3px solid", borderLeft: "3px solid" },
                    { top: 0, right: 0, borderTop: "3px solid", borderRight: "3px solid" },
                    { bottom: 0, left: 0, borderBottom: "3px solid", borderLeft: "3px solid" },
                    { bottom: 0, right: 0, borderBottom: "3px solid", borderRight: "3px solid" },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: "34px",
                        height: "34px",
                        ...pos,
                        borderColor: isScanning ? "var(--accent)" : "rgba(94, 139, 58, 0.6)",
                        transition: "border-color 0.3s",
                      } as React.CSSProperties}
                    />
                  ))}

                  <div
                    style={{
                      position: "absolute",
                      inset: "16px",
                      border: `1.5px dashed ${isScanning ? "var(--accent)" : "rgba(94, 139, 58, 0.3)"}`,
                      borderRadius: "10px",
                      transition: "border-color 0.3s",
                    }}
                  />

                  {isScanning && (
                    <div
                      style={{
                        position: "absolute",
                        left: "16px",
                        right: "16px",
                        height: "2px",
                        background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                        boxShadow: "0 0 8px var(--accent-glow)",
                        animation: "scan-line 1.5s ease-in-out infinite",
                        zIndex: 2,
                      }}
                    />
                  )}
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 24px",
                    background: isScanning ? "rgba(45, 57, 42, 0.78)" : "rgba(29, 22, 19, 0.76)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "var(--radius-full)",
                    border: `1px solid ${isScanning ? "rgba(145, 179, 89, 0.8)" : "rgba(255,255,255,0.18)"}`,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 800,
                      color: isScanning ? "#b8db7b" : "rgba(255,255,255,0.92)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {isScanning ? "Reading ID card..." : "Position your ID card here"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {error && (
          <div
            className="animate-slide-up"
            style={{
              padding: "12px 20px",
              background: "rgba(211, 91, 91, 0.08)",
              border: "1px solid rgba(211, 91, 91, 0.2)",
              borderRadius: "var(--radius-md)",
              color: "#ffd3d3",
              fontSize: "15px",
              width: "100%",
              textAlign: "center",
              textTransform: "uppercase",
              fontWeight: 800,
              letterSpacing: "0.03em",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "12px",
            alignItems: "stretch",
          }}
        >
          <Button
            variant="outline"
            size="md"
            onClick={handleScan}
            isLoading={isScanning || isLoading}
            disabled={!isReady || isScanning}
            className="btn-scan-action"
            style={{
              fontSize: "16px",
              width: "100%",
              borderRadius: "24px",
              textTransform: "uppercase",
              fontWeight: 800,
              minHeight: "54px",
            }}
          >
            {isScanning ? "Scanning..." : "Scan ID Card"}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => void openEmailAuth()}
            disabled={isScanning || isLoading}
            style={{
              width: "100%",
              borderRadius: "24px",
              textTransform: "uppercase",
              fontWeight: 800,
              minHeight: "54px",
            }}
          >
            Use Email
          </Button>
        </div>
      </section>
    </div>
  );
}
