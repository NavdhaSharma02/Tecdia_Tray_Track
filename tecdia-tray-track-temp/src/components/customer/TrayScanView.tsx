"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import { useCamera } from "@/hooks/useCamera";
import ScanOverlay from "@/components/camera/ScanOverlay";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import type { ScannedItem } from "@/types";

/**
 * Tray Scanning step — live camera feed with scan overlay. No emojis.
 */
export default function TrayScanView() {
  const { completeScan, setError, reset } = useCustomerFlow();
  const { videoRef, isReady, error: camError, start, stop, captureFrame } = useCamera();
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<ScannedItem[]>([]);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const handleScan = useCallback(async () => {
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
        // Camera might not be ready
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
      }
    } catch {
      if (progressRef.current) clearInterval(progressRef.current);
      setError("Scan failed. Please try again.");
      setIsScanning(false);
      setProgress(0);
      setDetectedItems([]);
    }
  }, [captureFrame, completeScan, setError, stop]);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
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

      {/* Camera container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/10",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--bg-elevated)",
          border: `2px solid ${isScanning ? "var(--success)" : "var(--border)"}`,
          transition: "border-color 0.3s ease",
          boxShadow: isScanning ? "var(--shadow-success-glow)" : "var(--shadow-md)",
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

      {/* Progress bar */}
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

      {/* Scan button */}
      {!isScanning && (
        <div
          className="mt-6 flex flex-col items-center gap-3"
          style={{ width: "100%", maxWidth: "400px" }}
        >
          <Button
            variant="primary"
            size="md"
            onClick={handleScan}
            disabled={!isReady}
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

      {isScanning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background:
              "linear-gradient(180deg, rgba(24, 18, 16, 0.9), rgba(53, 37, 32, 0.9))",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: "min(100%, 960px)",
              minHeight: "min(82vh, 760px)",
              borderRadius: "38px",
              background:
                "linear-gradient(180deg, rgba(255, 249, 245, 0.95), rgba(248, 239, 233, 0.92))",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
              padding: "28px",
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: "22px",
            }}
          >
            <div
              style={{
                borderRadius: "28px",
                position: "relative",
                minHeight: "320px",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(190, 121, 101, 0.28), transparent 28%), linear-gradient(180deg, #181210, #2f201c)",
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "28px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "420px",
                    aspectRatio: "1 / 1",
                    borderRadius: "32px",
                    border: "1px solid rgba(255,255,255,0.16)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: "16px",
                      borderRadius: "24px",
                      border: "1.5px dashed rgba(255,255,255,0.18)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: "26px",
                      borderRadius: "18px",
                      border: "2px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "12%",
                      right: "12%",
                      height: "3px",
                      top: detectedItems.length ? "72%" : "18%",
                      background: "linear-gradient(90deg, transparent, #f8ba71, transparent)",
                      boxShadow: "0 0 18px rgba(248, 186, 113, 0.8)",
                      animation: "scan-line 1.5s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      textAlign: "center",
                      color: "rgba(255,255,255,0.9)",
                      gap: "10px",
                    }}
                  >
                    <Spinner size={34} />
                    <p style={{ fontSize: "18px", fontWeight: 700 }}>
                      {detectedItems.length ? "Dish recognition in progress" : "Capturing tray image"}
                    </p>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                      Stay still while the tray contents are processed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "10px",
                  fontWeight: 700,
                }}
              >
                Full Screen Scan
              </p>
              <h2
                style={{
                  fontSize: "32px",
                  lineHeight: 1.1,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "10px",
                }}
              >
                {detectedItems.length
                  ? "Scanned dishes detected"
                  : "Scanning your tray now"}
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--text-secondary)",
                  marginBottom: "18px",
                }}
              >
                {detectedItems.length
                  ? "We are listing each dish as it is recognized from the tray."
                  : "Please hold still for a moment while the camera captures the tray contents."}
              </p>

              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(116, 76, 61, 0.12)",
                  borderRadius: "999px",
                  overflow: "hidden",
                  marginBottom: "18px",
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

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {detectedItems.length
                    ? `${detectedItems.length} dish${detectedItems.length === 1 ? "" : "es"} found`
                    : "Detecting dishes..."}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {Math.round(progress)}%
                </p>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "grid",
                  gap: "10px",
                  paddingRight: "4px",
                }}
              >
                {detectedItems.length ? (
                  detectedItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="animate-slide-up"
                      style={{
                        padding: "14px 16px",
                        borderRadius: "20px",
                        background: "rgba(255,255,255,0.62)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "14px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "2px",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {item.category} · {Math.round(item.confidence * 100)}% confidence
                        </p>
                      </div>
                      <p
                        style={{
                          fontSize: "15px",
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
                ) : (
                  <div
                    style={{
                      flex: 1,
                      minHeight: "180px",
                      borderRadius: "24px",
                      border: "1px dashed rgba(116, 76, 61, 0.28)",
                      background: "rgba(255,255,255,0.42)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "20px",
                    }}
                  >
                    <div>
                      <Spinner size={28} />
                      <p
                        style={{
                          marginTop: "12px",
                          fontSize: "14px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Detecting food items from the tray feed...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
