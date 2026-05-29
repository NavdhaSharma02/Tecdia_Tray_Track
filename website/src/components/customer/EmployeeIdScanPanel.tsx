"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useEmployeeIdScanner } from "@/hooks/useEmployeeIdScanner";

interface EmployeeIdScanPanelProps {
  videoElementId: string;
  onScan: (employeeCode: string) => void;
  isScanning: boolean;
  onScanningChange: (scanning: boolean) => void;
  isLoading?: boolean;
  instruction?: string;
  scanButtonLabel?: string;
  compact?: boolean;
  cameraActive?: boolean;
}

export default function EmployeeIdScanPanel({
  videoElementId,
  onScan,
  isScanning,
  onScanningChange,
  isLoading = false,
  instruction = "Hold your employee ID card in front of the camera",
  scanButtonLabel = "Scan ID Card",
  compact = false,
  cameraActive = true,
}: EmployeeIdScanPanelProps) {
  const {
    videoRef,
    isReady,
    camError,
    startCamera,
    stopCamera,
    beginScan,
  } = useEmployeeIdScanner({
    videoElementId,
    onScan: (code) => {
      onScanningChange(false);
      onScan(code);
    },
    isScanning,
  });

  useEffect(() => {
    if (!cameraActive) {
      stopCamera();
      return;
    }
    void startCamera();
    return () => stopCamera();
  }, [cameraActive, startCamera, stopCamera]);

  const handleStartScan = async () => {
    onScanningChange(true);
    await beginScan();
  };

  const aspectRatio = compact ? "16 / 7" : "16 / 5.8";
  const maxHeight = compact ? "min(28vh, 220px)" : "min(48vh, 460px)";

  return (
    <div>
      {!compact && instruction ? (
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          {instruction}
        </p>
      ) : null}

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio,
          maxHeight,
          borderRadius: compact ? "20px" : "32px",
          overflow: "hidden",
          background: "linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,238,231,0.52))",
          border: `2px solid ${isScanning ? "var(--accent)" : "rgba(109, 76, 64, 0.16)"}`,
          boxShadow: isScanning ? "var(--shadow-glow)" : "var(--shadow-md)",
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
              gap: "12px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "var(--danger)", fontWeight: 700, fontSize: "14px" }}>
              Camera not available
            </p>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>{camError}</p>
            <Button variant="outline" size="sm" onClick={() => void startCamera()}>
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
                  gap: "10px",
                  zIndex: 15,
                  background: "rgba(255, 251, 247, 0.72)",
                }}
              >
                <Spinner size={compact ? 28 : 36} />
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
                  Starting camera...
                </p>
              </div>
            )}

            <video
              id={videoElementId}
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
              <div style={{ width: "74%", height: "60%", position: "relative" }}>
                {[
                  { top: 0, left: 0, borderTop: "3px solid", borderLeft: "3px solid" },
                  { top: 0, right: 0, borderTop: "3px solid", borderRight: "3px solid" },
                  { bottom: 0, left: 0, borderBottom: "3px solid", borderLeft: "3px solid" },
                  { bottom: 0, right: 0, borderBottom: "3px solid", borderRight: "3px solid" },
                ].map((pos, index) => (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      width: compact ? "24px" : "34px",
                      height: compact ? "24px" : "34px",
                      ...(pos as React.CSSProperties),
                      borderColor: isScanning ? "var(--accent)" : "rgba(94, 139, 58, 0.6)",
                      transition: "border-color 0.3s",
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    inset: "16px",
                    border: `1.5px dashed ${isScanning ? "var(--accent)" : "rgba(94, 139, 58, 0.3)"}`,
                    borderRadius: "10px",
                  }}
                />
                {isScanning && (
                  <div
                    style={{
                      position: "absolute",
                      left: compact ? "20px" : "28px",
                      right: compact ? "20px" : "28px",
                      bottom: compact ? "18px" : "26px",
                      height: compact ? "8px" : "10px",
                      overflow: "hidden",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(255, 251, 247, 0.72)",
                      border: "1px solid rgba(145, 179, 89, 0.45)",
                      boxShadow: "0 10px 28px rgba(29, 22, 19, 0.16)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "inherit",
                        background:
                          "linear-gradient(90deg, var(--accent), var(--success), var(--accent-light))",
                        boxShadow: "0 0 16px var(--accent-glow)",
                        transformOrigin: "left",
                        animation: "scan-progress-fill 1.8s ease-in-out infinite",
                      }}
                    />
                  </div>
                )}
              </div>
              <div
                style={{
                  marginTop: compact ? "8px" : "14px",
                  padding: compact ? "8px 16px" : "12px 24px",
                  background: isScanning ? "rgba(45, 57, 42, 0.78)" : "rgba(29, 22, 19, 0.76)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${isScanning ? "rgba(145, 179, 89, 0.8)" : "rgba(255,255,255,0.18)"}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: compact ? "12px" : "15px",
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

      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "md"}
        onClick={() => void handleStartScan()}
        isLoading={isScanning || isLoading}
        disabled={!isReady || isScanning}
        className="w-full"
        style={{ marginTop: "12px" }}
      >
        {isScanning ? "Scanning..." : scanButtonLabel}
      </Button>
    </div>
  );
}
