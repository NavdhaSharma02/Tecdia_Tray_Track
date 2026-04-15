"use client";

import { useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";
import Spinner from "@/components/ui/Spinner";

interface CameraPreviewProps {
  autoStart?: boolean;
  className?: string;
  onReady?: () => void;
}

/**
 * Live camera preview component.
 * Renders a <video> element that streams from the device camera.
 */
export default function CameraPreview({
  autoStart = true,
  className,
  onReady,
}: CameraPreviewProps) {
  const { videoRef, isReady, error, start } = useCamera();

  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  useEffect(() => {
    if (isReady && onReady) {
      onReady();
    }
  }, [isReady, onReady]);

  if (error) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)",
          minHeight: "400px",
          padding: "32px",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-muted)" }}>Camera</div>
        <p style={{ color: "var(--danger)", fontWeight: 600, fontSize: "16px" }}>
          Camera Error
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
          {error}
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
          Please ensure camera permissions are granted and try again.
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative" }}>
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
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-lg)",
            zIndex: 5,
          }}
        >
          <Spinner size={32} />
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
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
          borderRadius: "var(--radius-lg)",
          transform: "scaleX(-1)",
          background: "var(--bg-primary)",
        }}
      />
    </div>
  );
}

export { CameraPreview };
