"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import { useCamera } from "@/hooks/useCamera";
import ScanOverlay from "@/components/camera/ScanOverlay";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import * as api from "@/services/api";

/**
 * Tray Scanning step — live camera feed with scan overlay. No emojis.
 */
export default function TrayScanView() {
  const { completeScan, setError } = useCustomerFlow();
  const { videoRef, isReady, error: camError, start, stop, captureFrame } = useCamera();
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setProgress(0);

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

      await new Promise((r) => setTimeout(r, 400));

      if (result.ok && result.data) {
        stop();
        completeScan(result.data);
      } else {
        setError(result.error || "Scan failed");
        setIsScanning(false);
        setProgress(0);
      }
    } catch {
      if (progressRef.current) clearInterval(progressRef.current);
      setError("Scan failed. Please try again.");
      setIsScanning(false);
      setProgress(0);
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
        justifyContent: "center",
        minHeight: "100%",
        padding: "10px 20px 18px",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-script)",
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
        <Button
          variant="success"
          size="xl"
          onClick={handleScan}
          disabled={!isReady}
          className="mt-6"
          style={{ width: "100%", maxWidth: "400px", fontSize: "20px" }}
        >
          Scan Tray
        </Button>
      )}

      {isScanning && (
        <p
          className="animate-fade-in"
          style={{
            marginTop: "16px",
            fontSize: "15px",
            color: "var(--text-secondary)",
          }}
        >
          Detecting food items... Please wait
        </p>
      )}
    </div>
  );
}
