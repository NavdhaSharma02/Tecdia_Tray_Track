"use client";

import { useState, useEffect, useRef } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import { useCamera } from "@/hooks/useCamera";
import ScanOverlay from "@/components/camera/ScanOverlay";
import Button from "@/components/ui/Button";
import PinPadModal from "@/components/ui/PinPadModal";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import type { ScannedItem } from "@/types";

/**
 * Tray Scanning step.
 * Shows dish detection directly in the main page without a dark modal backdrop.
 */
export default function TrayScanView() {
  const { completeScan, enterManualBilling, setError, error, clearError } =
    useCustomerFlow();
  const { videoRef, isReady, error: camError, start, stop, captureFrame } = useCamera();

  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<ScannedItem[]>([]);
  const [uploadedTrayImage, setUploadedTrayImage] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [manualPinOpen, setManualPinOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const hasScanned = useRef(false);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
    };
  }, [uploadedPreviewUrl]);

  function handleUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
    setUploadedTrayImage(file);
    setUploadedPreviewUrl(URL.createObjectURL(file));
    hasScanned.current = false;
    if (error) clearError();
  }

  async function handleManualBillingPin(pin: string) {
    const result = await api.verifySuperPin(pin);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setManualPinOpen(false);
    enterManualBilling();
    return { ok: true };
  }

  async function runScan() {
    if (hasScanned.current) return;
    if (error) clearError();
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
      let imageBlob: Blob | undefined = uploadedTrayImage ?? undefined;
      if (!imageBlob) {
        try {
          imageBlob = await captureFrame();
        } catch {
          // Camera not ready; the scan API will return a user-facing error.
        }
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
        hasScanned.current = false;
      }
    } catch {
      if (progressRef.current) clearInterval(progressRef.current);
      setError("Scan failed. Please try again.");
      setIsScanning(false);
      setProgress(0);
      setDetectedItems([]);
      hasScanned.current = false;
    }
  }

  return (
    <div
      className="animate-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100%",
        padding: "18px 24px 18px",
        maxWidth: "1120px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          width: "100%",
          marginBottom: "14px",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2.35rem, 4.4vw, 3.2rem)",
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            textAlign: "center",
            textShadow: "0 10px 26px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.28)",
          }}
        >
          {isScanning
            ? detectedItems.length
              ? "Detected and Scanned"
              : "Scanning Your Tray..."
            : uploadedTrayImage
              ? "Uploaded Tray Ready"
              : "Position Your Tray"}
        </h2>
        <button
          onClick={() => setShowInstructions((prev) => !prev)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "999px",
            border: "none",
            background: "rgba(255,255,255,0.85)",
            color: "#000",
            fontWeight: 700,
            fontSize: "18px",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-expanded={showInstructions}
          aria-label="Toggle instructions"
        >
          i
        </button>
      </div>
      {showInstructions && (
        <div
          style={{
            position: "fixed",
            top: "var(--header-clearance)",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.12)",
          }}
        >
          <button
            onClick={() => setShowInstructions(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              border: "none",
              background: "#ff4d4f",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "18px",
              cursor: "pointer",
              zIndex: 20,
            }}
            aria-label="Close instructions"
          >
            ×
          </button>
          <img
            src="/ins_man.png"
            alt="Instructions"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: "20px",
              display: "block",
            }}
          />
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/8.5",
          maxHeight: "52vh",
          borderRadius: "28px",
          overflow: "hidden",
          background: "var(--bg-elevated)",
          border: `2px solid ${isScanning ? "var(--success)" : "var(--border)"}`,
          transition: "border-color 0.3s ease",
          boxShadow: isScanning ? "var(--shadow-success-glow)" : "var(--shadow-md)",
          display: isScanning ? "none" : "block",
        }}
      >
        {uploadedPreviewUrl ? (
          <>
            <div
              role="img"
              aria-label="Uploaded tray"
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url("${uploadedPreviewUrl}")`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundColor: "var(--bg-primary)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "20px",
                bottom: "18px",
                zIndex: 15,
                padding: "9px 14px",
                borderRadius: "999px",
                background: "rgba(27, 21, 18, 0.76)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                backdropFilter: "blur(10px)",
              }}
            >
              Uploaded image selected
            </div>
          </>
        ) : camError ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "18px",
              padding: "40px",
            }}
          >
            <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-secondary)" }}>
              Camera
            </p>
            <p style={{ color: "var(--danger)", fontWeight: 600 }}>Camera Not Available</p>
            <p style={{ color: "var(--text-muted)", fontSize: "16px", textAlign: "center" }}>
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
                <Spinner size={42} />
                <p style={{ color: "var(--text-secondary)" }}>Starting camera...</p>
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

      {!isScanning && error && (
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            marginTop: "12px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "rgba(220, 53, 69, 0.12)",
            border: "1px solid rgba(220, 53, 69, 0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <p style={{ color: "var(--danger)", fontSize: "15px", fontWeight: 600, textAlign: "center" }}>
            {error}
          </p>
          <Button variant="primary" size="sm" onClick={() => setManualPinOpen(true)}>
            Manual billing (Staff)
          </Button>
        </div>
      )}

      {!isScanning && (
        <div
          className="mt-6 flex flex-col items-center gap-3"
          style={{ width: "100%", maxWidth: "720px", marginTop: "8px" }}
        >
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            style={{ display: "none" }}
          />
          <div
            style={{
              width: "100%",
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <Button
              variant="outline"
              size="lg"
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="btn-scan-action"
              style={{ flex: "1 1 220px", fontSize: "16px", transform: "translateY(-4px)" }}
            >
              Upload Image
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => void runScan()}
              className="btn-scan-action"
              style={{ flex: "1 1 220px", fontSize: "16px", transform: "translateY(-4px)" }}
            >
              {uploadedTrayImage ? "Scan Uploaded Image" : "Scan Tray"}
            </Button>
          </div>
          <Button
            variant="primary"
            size="lg"
            type="button"
            onClick={() => setManualPinOpen(true)}
            className="btn-scan-action"
            style={{ width: "100%", fontSize: "16px", transform: "translateY(-4px)" }}
          >
            Manual billing (Staff)
          </Button>
        </div>
      )}

      <PinPadModal
        isOpen={manualPinOpen}
        onClose={() => setManualPinOpen(false)}
        title="Manual billing"
        description="Enter the cashier PIN or admin PIN to bill this tray without scanning."
        submitLabel="Start manual billing"
        onSubmit={handleManualBillingPin}
      />

      {isScanning && (
        <div
          className="animate-fade-in"
          style={{
            width: "100%",
            borderRadius: "34px",
            background: "linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(250, 248, 245, 0.94) 100%)",
            border: "1.5px solid rgba(116, 76, 61, 0.12)",
            boxShadow: "0 24px 64px rgba(74, 41, 33, 0.14)",
            padding: "30px 28px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            overflow: "hidden",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
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
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.2,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              {detectedItems.length
                ? `${detectedItems.length} dish${detectedItems.length === 1 ? "" : "es"} detected and scanned`
                : "Scanning your tray..."}
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {detectedItems.length
                ? "Items are listed as they are recognised."
                : "Hold still while the camera processes the tray."}
            </p>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {detectedItems.length
                  ? `${detectedItems.length} dish${detectedItems.length === 1 ? "" : "es"} found`
                  : "Detecting dishes..."}
              </span>
              <span
                style={{
                  fontSize: "13px",
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
                height: "8px",
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              alignContent: "start",
              minHeight: "260px",
            }}
          >
            {detectedItems.length === 0 ? (
              <div
                style={{
                  minHeight: "220px",
                  gridColumn: "1 / -1",
                  borderRadius: "20px",
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
                <Spinner size={26} />
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Waiting for dishes to appear...
                </p>
              </div>
            ) : (
              detectedItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="animate-slide-up"
                  style={{
                    padding: "16px 16px 14px",
                    borderRadius: "18px",
                    background: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(116, 76, 61, 0.12)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "16px",
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
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {item.category} · {Math.round(item.confidence * 100)}% confidence
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "var(--accent)",
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
