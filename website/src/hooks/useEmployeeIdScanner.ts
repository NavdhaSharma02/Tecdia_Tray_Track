"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";

interface UseEmployeeIdScannerOptions {
  videoElementId: string;
  onScan: (employeeCode: string) => void;
  isScanning: boolean;
}

interface UseEmployeeIdScannerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  camError: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  barcodeBuffer: string;
  beginScan: () => Promise<void>;
}

/**
 * Camera + barcode/keyboard ID scanning (ZXing + keyboard wedge).
 */
export function useEmployeeIdScanner({
  videoElementId,
  onScan,
  isScanning,
}: UseEmployeeIdScannerOptions): UseEmployeeIdScannerReturn {
  const { videoRef, isReady, error: camError, start, stop, captureFrame } = useCamera();
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const barcodeBufferRef = useRef("");
  const codeReaderRef = useRef<{ reset: () => void } | null>(null);
  const selectedDeviceIdRef = useRef<string | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const beginScan = useCallback(async () => {
    barcodeBufferRef.current = "";
    setBarcodeBuffer("");
    try {
      await captureFrame();
    } catch {
      // Scanner can use live video without a warm frame.
    }
  }, [captureFrame]);

  const handleScannedCode = useCallback((raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    barcodeBufferRef.current = "";
    setBarcodeBuffer("");
    onScanRef.current(code);
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const code = barcodeBufferRef.current.trim();
        if (!code) return;
        event.preventDefault();
        handleScannedCode(code);
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
  }, [handleScannedCode, isScanning]);

  useEffect(() => {
    let mounted = true;
    let stopped = false;

    async function loadAndStartDecoder() {
      const video =
        videoRef.current ||
        (document.getElementById(videoElementId) as HTMLVideoElement | null);
      if (!video) return;

      if (!(window as Window & { ZXing?: unknown }).ZXing) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/@zxing/library@latest";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = (event) => reject(event);
          document.head.appendChild(script);
        }).catch(() => undefined);
      }

      const ZX = (window as Window & { ZXing?: { BrowserMultiFormatReader: new () => unknown } })
        .ZXing;
      if (!ZX) return;

      try {
        if (!codeReaderRef.current) {
          codeReaderRef.current = new ZX.BrowserMultiFormatReader() as {
            reset: () => void;
            listVideoInputDevices: () => Promise<Array<{ deviceId: string }>>;
            decodeFromVideoDevice: (
              deviceId: string,
              elementId: string,
              callback: (result: { text?: string } | null, err: unknown) => void
            ) => void;
          };
        }
        const codeReader = codeReaderRef.current as {
          reset: () => void;
          listVideoInputDevices: () => Promise<Array<{ deviceId: string }>>;
          decodeFromVideoDevice: (
            deviceId: string,
            elementId: string,
            callback: (result: { text?: string } | null, err: unknown) => void
          ) => void;
        };

        if (!selectedDeviceIdRef.current) {
          const devices = await codeReader.listVideoInputDevices();
          selectedDeviceIdRef.current = devices?.[0]?.deviceId ?? null;
        }

        const deviceId = selectedDeviceIdRef.current;
        if (!deviceId) return;

        codeReader.decodeFromVideoDevice(deviceId, videoElementId, (result, _err) => {
          if (stopped || !mounted) return;
          if (result?.text) {
            try {
              codeReader.reset();
            } catch {
              // ignore reset errors
            }
            stopped = true;
            handleScannedCode(String(result.text));
          }
        });
      } catch {
        // ZXing unavailable; keyboard wedge still works.
      }
    }

    if (isScanning && isReady) {
      void loadAndStartDecoder();
    }

    return () => {
      mounted = false;
      stopped = true;
      try {
        codeReaderRef.current?.reset();
      } catch {
        // ignore reset errors
      }
    };
  }, [handleScannedCode, isReady, isScanning, videoElementId, videoRef]);

  return {
    videoRef,
    isReady,
    camError,
    startCamera: start,
    stopCamera: stop,
    barcodeBuffer,
    beginScan,
  };
}
