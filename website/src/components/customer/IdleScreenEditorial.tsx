"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import { useCamera } from "@/hooks/useCamera";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function IdleScreenEditorial() {
  const { identifyEmployee, openEmailAuth, isLoading, error, clearError } = useCustomerFlow();
  const { videoRef, isReady, error: camError, start, stop, captureFrame } = useCamera();
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const barcodeBufferRef = useRef("");
  const codeReaderRef = useRef<any>(null);
  const selectedDeviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const handleScan = useCallback(async () => {
    // Prepare for scanning: clear buffers and enable scanner
    barcodeBufferRef.current = "";
    setBarcodeBuffer("");
    setIsScanning(true);
    if (error) clearError();

    try {
      try {
        // warm the camera (capture a frame) so video element has data
        await captureFrame();
      } catch {
        // ignore capture errors; scanner will rely on live video
      }
    } catch {
      // ignore
    }
  }, [captureFrame, error, clearError]);

  // Keyboard buffer handler (for keyboard-emulating scanners)
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

  useEffect(() => {
    let mounted = true;
    let stopped = false;

    async function loadAndStartDecoder() {
      const video = videoRef.current || (document.querySelector('video') as HTMLVideoElement);
      if (!video) return;

      // Load ZXing from CDN if global not present
      if (!(window as any).ZXing) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/@zxing/library@latest';
          s.async = true;
          s.onload = () => resolve();
          s.onerror = (e) => reject(e);
          document.head.appendChild(s);
        }).catch(() => {
          return;
        });
      }

      if (!(window as any).ZXing) return;

      try {
        const ZX = (window as any).ZXing;
        console.debug("ZXing loaded", ZX ? "yes" : "no");
        if (!codeReaderRef.current) codeReaderRef.current = new ZX.BrowserMultiFormatReader();
        const codeReader = codeReaderRef.current;

        if (!selectedDeviceIdRef.current) {
          const devices = await codeReader.listVideoInputDevices();
          console.debug("ZXing devices found", devices?.length, devices);
          selectedDeviceIdRef.current = devices?.[0]?.deviceId ?? null;
        }

        const deviceId = selectedDeviceIdRef.current;
        if (!deviceId) {
          console.debug("ZXing no video device found");
          return;
        }

        console.debug("ZXing decodeFromVideoDevice using", deviceId);
        codeReader.decodeFromVideoDevice(deviceId, 'barcode-scan-video', (result: any, err: any) => {
          if (stopped || !mounted) return;
          if (result && result.text) {
            console.debug("ZXing result", result.text);
            try {
              codeReader.reset();
            } catch {}
            stopped = true;
            setIsScanning(false);
            void identifyEmployee(String(result.text).trim().toUpperCase());
          }
          if (err) {
            console.debug("ZXing decode error", err);
          }
        });
      } catch (e) {
        console.debug("ZXing start failed", e);
      }
    }

    if (isScanning && isReady) {
      void loadAndStartDecoder();
    }

    return () => {
      mounted = false;
      stopped = true;
      try {
        if (codeReaderRef.current) codeReaderRef.current.reset();
      } catch {}
    };
  }, [isScanning, isReady, identifyEmployee, videoRef]);

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
                id="barcode-scan-video"
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
