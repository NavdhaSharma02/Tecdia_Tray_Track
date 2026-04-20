"use client";
import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import { useCamera } from "@/hooks/useCamera";
import ScanOverlay from "@/components/camera/ScanOverlay";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import type { ScannedItem } from "@/types";

/**
 * Tray Scanning step — auto-scans on mount, just like the ID scan step.
 * No button press required. Falls back to mock data if camera/backend unavailable.
 */
export default function TrayScanView() {
  const { completeScan, setError, reset } = useCustomerFlow();
  const { videoRef, isReady, error: camError, start, stop, captureFrame } = useCamera();

  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<ScannedItem[]>([]);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const hasScanned = useRef(false);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Start camera on mount
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Mirror camera stream into the scan-card video when scanning starts
  useEffect(() => {
    if (isScanning && secondaryVideoRef.current && videoRef.current?.srcObject) {
      secondaryVideoRef.current.srcObject = videoRef.current.srcObject;
      void secondaryVideoRef.current.play().catch(() => {});
    }
  }, [isScanning, videoRef]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  // Core scan function — NOT wrapped in useCallback to avoid stale closure issues
  async function runScan() {
    if (hasScanned.current) return;
    hasScanned.current = true;

    setIsScanning(true);
    setProgress(0);
    setDetectedItems([]);

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 200);

    try {
      let imageBlob: Blob | undefined;
      try {
        imageBlob = await captureFrame();
      } catch {
        // Camera not ready — scan continues with mock data fallback
      }

      const result = await api.scanTray(imageBlob);

      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(100);

      if (result.ok && result.data) {
        for (const item of result.data) {
          setDetectedItems((prev) => [...prev, item]);
          await wait(350);
        }
        await wait(700);
        stop();
        completeScan(result.data);
      } else {
        setError(result.error || "Scan failed");
        setIsScanning(false);
        setProgress(0);
        setDetectedItems([]);
        hasScanned.current = false; // allow retry
      }
    } catch {
      if (progressRef.current) clearInterval(progressRef.current);
      setError("Scan failed. Please try again.");
      setIsScanning(false);
      setProgress(0);
      setDetectedItems([]);
      hasScanned.current = false; // allow retry
    }
  }

  // AUTO-TRIGGER on mount — same as ID scan (fires after 1.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      void runScan();
    }, 1500);
    return () => clearTimeout(timer);
  // runScan is defined in render scope; intentional omission to avoid re-firing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="animate-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100%",
        padding: "34px 20px 18px",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "28px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "18px",
          textAlign: "center",
        }}
      >
        {isScanning ? "Scanning Your Tray..." : "Position Your Tray"}
      </h2>

      {/* Camera container — hidden while scanning so stream stays alive for captureFrame */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/10",
          borderRadius: "20px",
          overflow: "hidden",
          background: "var(--bg-elevated)",
          border: `2px solid ${isScanning ? "var(--success)" : "var(--border)"}`,
          transition: "border-color 0.3s ease",
          boxShadow: isScanning ? "var(--shadow-success-glow)" : "var(--shadow-md)",
          display: isScanning ? "none" : "block",
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
              gap: "16px",
              padding: "32px",
            }}
          >
            <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-secondary)" }}>
              Camera
            </p>
            <p style={{ color: "var(--danger)", fontWeight: 600 }}>Camera Not Available</p>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
              {camError}
            </p>
            <Button variant="outline" size="md" onClick={start}>
              Retry Camera
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
                  background: "var(--bg-elevated)",
                }}
              >
                <Spinner size={36} />
                <p style={{ color: "var(--text-secondary)" }}>
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
              }}
            />
            <ScanOverlay isScanning={isScanning} />
          </>
        )}
      </div>

      {/* Progress bar (shown below camera while scanning) */}
      {isScanning && (
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "var(--bg-secondary)",
            borderRadius: "3px",
            marginTop: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
              borderRadius: "3px",
              transition: "width 0.2s ease",
            }}
          />
        </div>
      )}

      {/* Manual scan button — shown only before auto-scan fires or as retry */}
      {!isScanning && (
        <div
          className="mt-6 flex flex-col items-center gap-3"
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <Button
            variant="primary"
            size="md"
            onClick={() => void runScan()}
            style={{ width: "100%", fontSize: "14px" }}
          >
            Scan Tray
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void reset()}
            style={{ width: "100%" }}
          >
            Cancel and log out
          </Button>
        </div>
      )}

      {/* ── Scanning overlay: ONE unified card ── */}
      {isScanning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(20, 14, 12, 0.55)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: "min(100%, 480px)",
              maxHeight: "min(90vh, 680px)",
              borderRadius: "28px",
              background: "linear-gradient(160deg, #fffaf6 0%, #f8ede4 100%)",
              border: "1.5px solid rgba(198, 110, 91, 0.18)",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.36)",
              padding: "28px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              overflow: "hidden",
            }}
          >
            {/* ── Title row ── */}
            <div>
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                Tray Scan
              </p>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}
              >
                {detectedItems.length
                  ? `${detectedItems.length} dish${detectedItems.length === 1 ? "" : "es"} detected`
                  : "Scanning your tray…"}
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>
                {detectedItems.length
                  ? "Items are listed as they are recognised."
                  : "Hold still while the camera processes the tray."}
              </p>
            </div>

            {/* ── Camera preview in the scan card ── */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "180px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #fdf6ef 0%, #f5e8d8 100%)",
                overflow: "hidden",
                flexShrink: 0,
                border: "1.5px solid rgba(198, 110, 91, 0.22)",
                boxShadow: "0 4px 20px rgba(198,110,91,0.10)",
              }}
            >
              {/* Live camera feed */}
              <video
                ref={secondaryVideoRef}
                playsInline
                muted
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.82,
                }}
              />

              {/* Warm overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(253,246,239,0.08) 0%, rgba(245,232,216,0.18) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Animated scan line */}
              <div
                style={{
                  position: "absolute",
                  left: "6%",
                  right: "6%",
                  height: "2px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "linear-gradient(90deg, transparent, var(--accent) 50%, transparent)",
                  boxShadow: "0 0 14px rgba(198,110,91,0.75)",
                  animation: "scan-line 1.6s ease-in-out infinite",
                  zIndex: 5,
                }}
              />

              {/* Corner markers */}
              {([
                { top: "10px", left: "10px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)", borderRadius: "5px 0 0 0" },
                { top: "10px", right: "10px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)", borderRadius: "0 5px 0 0" },
                { bottom: "10px", left: "10px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)", borderRadius: "0 0 0 5px" },
                { bottom: "10px", right: "10px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)", borderRadius: "0 0 5px 0" },
              ] satisfies React.CSSProperties[]).map((s, i) => (
                <div key={i} style={{ position: "absolute", width: "18px", height: "18px", zIndex: 6, ...s }} />
              ))}

              {/* Status label at bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  background: "rgba(253,246,239,0.82)",
                  backdropFilter: "blur(6px)",
                  borderTop: "1px solid rgba(198,110,91,0.12)",
                  zIndex: 7,
                }}
              >
                <Spinner size={14} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {detectedItems.length ? "Recognising dishes…" : "Capturing tray image…"}
                </span>
              </div>
            </div>

            {/* ── Progress bar ── */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {detectedItems.length
                    ? `${detectedItems.length} dish${detectedItems.length === 1 ? "" : "es"} found`
                    : "Detecting dishes…"}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  background: "rgba(116, 76, 61, 0.14)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                    borderRadius: "999px",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* ── Live dish list ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {detectedItems.length === 0 ? (
                <div
                  style={{
                    minHeight: "96px",
                    borderRadius: "14px",
                    border: "1px dashed rgba(116, 76, 61, 0.25)",
                    background: "rgba(255,255,255,0.42)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "16px",
                  }}
                >
                  <Spinner size={22} />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Waiting for dishes to appear…
                  </p>
                </div>
              ) : (
                detectedItems.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="animate-slide-up"
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(198, 110, 91, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {item.category} · {Math.round(item.confidence * 100)}% confidence
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--accent)",
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
