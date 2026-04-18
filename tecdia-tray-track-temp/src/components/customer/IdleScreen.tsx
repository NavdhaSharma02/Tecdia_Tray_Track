"use client";

import { useState, useEffect, useCallback } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import { useCamera } from "@/hooks/useCamera";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import TecdiaLogo from "@/components/layout/TecdiaLogo";

const DEMO_EMPLOYEE_IDS = ["EMP-001", "EMP-002", "EMP-003", "EMP-004", "EMP-005"];

/**
 * Default screen — camera-based Employee ID scanning.
 * Shows a live camera feed where the employee holds up their ID card.
 * Camera-based employee ID scanning screen.
 */
export default function IdleScreen() {
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
      let imageBlob: Blob | undefined;
      try {
        imageBlob = await captureFrame();
      } catch {
        // Ignore capture failures and continue with the demo scan flow.
      }

      await new Promise((r) => setTimeout(r, 1800));
      const scannedId =
        DEMO_EMPLOYEE_IDS[Math.floor(Math.random() * DEMO_EMPLOYEE_IDS.length)];

      await identifyEmployee(scannedId);
    } catch {
      // Flow errors are surfaced by the shared customer state.
    } finally {
      setIsScanning(false);
    }
  }, [captureFrame, identifyEmployee, error, clearError]);

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100%",
        width: "100%",
        maxWidth: "860px",
        margin: "0 auto",
        padding: "2px 18px 12px",
        gap: "10px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "560px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            alignItems: "center",
            gap: "8px",
            padding: "4px 20px 4px",
            justifyItems: "center",
          }}
        >
          <TecdiaLogo size="lg" />
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "760px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "6px",
          }}
        >
          Welcome! Please scan your ID to get started
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            marginBottom: "0",
          }}
        >
          Hold your employee ID card in front of the camera to continue
        </p>
      </section>

      {/* Camera Feed */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          aspectRatio: "16/9",
          borderRadius: "36px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.74)",
          border: `2px solid ${isScanning ? "var(--accent)" : "var(--border)"}`,
          boxShadow: isScanning ? "var(--shadow-glow)" : "var(--shadow-md)",
          backdropFilter: "blur(12px)",
          transition: "border-color 0.3s, box-shadow 0.3s",
          marginTop: "4px",
        }}
      >
        {camError ? (
          /* Camera error fallback */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "14px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              Camera
            </p>
            <p style={{ color: "var(--danger)", fontWeight: 600 }}>
              Camera Not Available
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {camError}
            </p>
            <Button variant="outline" size="md" onClick={start}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Loading state */}
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
                  background: "var(--bg-elevated)",
                }}
              >
                <Spinner size={32} />
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                  Starting camera...
                </p>
              </div>
            )}

            {/* Video feed */}
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

            {/* Card positioning overlay */}
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
              {/* Card guide rectangle */}
              <div
                style={{
                  width: "65%",
                  height: "45%",
                  position: "relative",
                }}
              >
                {/* Corner brackets */}
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
                      width: "28px",
                      height: "28px",
                      ...pos,
                      borderColor: isScanning ? "var(--accent)" : "rgba(94, 139, 58, 0.6)",
                      transition: "border-color 0.3s",
                    } as React.CSSProperties}
                  />
                ))}

                {/* Inner dashed border */}
                <div
                  style={{
                    position: "absolute",
                    inset: "14px",
                    border: `1.5px dashed ${isScanning ? "var(--accent)" : "rgba(94, 139, 58, 0.3)"}`,
                    borderRadius: "8px",
                    transition: "border-color 0.3s",
                  }}
                />

                {/* Scanning line animation */}
                {isScanning && (
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      right: "14px",
                      height: "2px",
                      background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                      boxShadow: "0 0 8px var(--accent-glow)",
                      animation: "scan-line 1.5s ease-in-out infinite",
                      zIndex: 2,
                    }}
                  />
                )}
              </div>

              {/* Instruction pill */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 24px",
                  background: isScanning
                    ? "rgba(45, 57, 42, 0.74)"
                    : "rgba(10, 10, 15, 0.74)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${isScanning ? "rgba(145, 179, 89, 0.8)" : "rgba(255,255,255,0.18)"}`,
                }}
              >
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: isScanning ? "#b8db7b" : "rgba(255,255,255,0.92)",
                    }}
                  >
                  {isScanning ? "Reading ID card..." : "Position your ID card here"}
                  </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div
          className="animate-slide-up"
          style={{
            marginBottom: "16px",
            padding: "10px 18px",
            background: "rgba(211, 91, 91, 0.08)",
            border: "1px solid rgba(211, 91, 91, 0.2)",
            borderRadius: "var(--radius-md)",
            color: "var(--danger)",
            fontSize: "14px",
            maxWidth: "500px",
            width: "100%",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: "440px", display: "grid", gap: "10px" }}>
        <Button
          variant="primary"
          size="xl"
          onClick={handleScan}
          isLoading={isScanning || isLoading}
          disabled={!isReady || isScanning}
          style={{
            fontSize: "17px",
            width: "100%",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {isScanning ? "Scanning..." : "Scan ID Card"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={openEmailAuth}
          disabled={isScanning || isLoading}
          style={{ width: "100%" }}
        >
          Use Email
        </Button>
      </div>
    </div>
  );
}
