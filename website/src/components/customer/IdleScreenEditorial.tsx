"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";

export default function IdleScreenEditorial() {
  const { identifyEmployee, openEmailAuth, isLoading, error, clearError } = useCustomerFlow();
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const barcodeBufferRef = useRef("");

  const handleScan = useCallback(() => {
    // Prepare for scanning: clear buffers and enable scanner
    barcodeBufferRef.current = "";
    setBarcodeBuffer("");
    setIsScanning(true);
    if (error) clearError();
  }, [error, clearError]);

  const handleEmailAuth = () => {
    barcodeBufferRef.current = "";
    setBarcodeBuffer("");
    setIsScanning(false);
    void openEmailAuth();
  };

  // Keyboard buffer handler (for laser scanner input)
  useEffect(() => {
    if (!isScanning) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const code = barcodeBufferRef.current.trim();
        if (!code) return;
        event.preventDefault();
        const scannedId = code.toUpperCase();
        barcodeBufferRef.current = "";
        setBarcodeBuffer("");
        setIsScanning(false);
        void identifyEmployee(scannedId);
        return;
      }

      if (event.key === "Escape") {
        barcodeBufferRef.current = "";
        setBarcodeBuffer("");
        setIsScanning(false);
        return;
      }

      if (/^[a-zA-Z0-9_-]$/.test(event.key)) {
        barcodeBufferRef.current += event.key;
        setBarcodeBuffer(barcodeBufferRef.current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [identifyEmployee, isScanning]);

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
            border: "2px solid rgba(109, 76, 64, 0.16)",
            boxShadow: "var(--shadow-md)",
            backdropFilter: "blur(12px)",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
        >
          <div className="id-scanner-visual" aria-hidden="true">
            <div className="id-scanner-card">
              <div className="id-scanner-card__chip" />
              <div className="id-scanner-card__photo" />
              <div className="id-scanner-card__lines">
                <span />
                <span />
                <span />
              </div>
              <div className="id-scanner-barcode">
                {[12, 7, 18, 9, 14, 6, 20, 8, 16, 10, 5, 18].map((width, index) => (
                  <span key={index} style={{ width: `${width}px` }} />
                ))}
              </div>
            </div>
            <div className="id-scanner-laser" />
            <div className="id-scanner-glow" />
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              pointerEvents: "none",
              zIndex: 10,
              padding: "0 24px 12px",
            }}
          >
            <div
              style={{
                marginTop: "14px",
                padding: isScanning ? "12px 16px 14px" : "12px 24px",
                background: isScanning ? "rgba(255, 251, 247, 0.78)" : "rgba(255, 251, 247, 0.72)",
                backdropFilter: "blur(10px)",
                borderRadius: isScanning ? "22px" : "var(--radius-full)",
                border: "1px solid rgba(109, 76, 64, 0.14)",
                minWidth: isScanning ? "min(360px, 72vw)" : "auto",
                boxShadow: "0 18px 42px rgba(67, 41, 33, 0.12)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#231712",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {isScanning ? "Reading employee ID..." : "Press Scan ID to begin"}
              </p>
              {isScanning && (
                <div
                  style={{
                    height: "9px",
                    marginTop: "12px",
                    overflow: "hidden",
                    borderRadius: "var(--radius-full)",
                    background: "rgba(109, 76, 64, 0.1)",
                    border: "1px solid rgba(109, 76, 64, 0.12)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "inherit",
                      background:
                        "linear-gradient(90deg, var(--accent), var(--success), var(--accent-light))",
                      boxShadow: "0 0 18px var(--accent-glow)",
                      transformOrigin: "left",
                      animation: "scan-progress-fill 1.8s ease-in-out infinite",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
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
            disabled={isScanning}
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
            onClick={handleEmailAuth}
            disabled={isLoading}
            style={{
              width: "100%",
              borderRadius: "24px",
              textTransform: "uppercase",
              fontWeight: 800,
              minHeight: "54px",
            }}
          >
            Sign Up / Log In
          </Button>
        </div>
      </section>
    </div>
  );
}
