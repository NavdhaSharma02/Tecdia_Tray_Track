"use client";

interface ScanOverlayProps {
  isScanning?: boolean;
  instruction?: string;
}

/**
 * Overlay rendered on top of the camera preview.
 * Shows tray positioning guides and scanning animation.
 */
export default function ScanOverlay({
  isScanning = false,
  instruction = "Place your tray within the frame",
}: ScanOverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Tray guide rectangle */}
      <div
        style={{
          position: "relative",
          width: "82%",
          height: "66%",
          maxWidth: "680px",
          maxHeight: "460px",
        }}
      >
        {/* Corner markers */}
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
                width: "48px",
                height: "48px",
                ...pos,
                borderColor: isScanning ? "var(--success)" : "var(--accent-light)",
                transition: "border-color 0.3s ease",
            } as React.CSSProperties}
          />
        ))}

        {/* Center dashed border */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: `2px dashed ${isScanning ? "var(--success)" : "rgba(187, 129, 105, 0.42)"}`,
            borderRadius: "var(--radius-md)",
            transition: "border-color 0.3s ease",
          }}
        />

        {/* Scanning line */}
        {isScanning && (
          <div
            style={{
              position: "absolute",
              left: "24px",
              right: "24px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, var(--success), transparent)",
              boxShadow: "0 0 12px var(--success-glow)",
              animation: "scan-line 2s ease-in-out infinite",
              zIndex: 2,
            }}
          />
        )}

        {/* Scanning pulse rings */}
        {isScanning && (
          <>
          <div
            style={{
              position: "absolute",
              inset: "-14px",
              border: "2px solid var(--success)",
              borderRadius: "var(--radius-lg)",
              animation: "scan-ring 1.5s ease-out infinite",
              }}
            />
          <div
            style={{
              position: "absolute",
              inset: "-14px",
              border: "2px solid var(--success)",
              borderRadius: "var(--radius-lg)",
              animation: "scan-ring 1.5s ease-out 0.5s infinite",
              }}
            />
          </>
        )}
      </div>

      {/* Instruction text */}
      <div
        style={{
          marginTop: "28px",
          padding: "14px 30px",
          background: isScanning
            ? "rgba(58, 73, 52, 0.78)"
            : "rgba(27, 21, 18, 0.76)",
          backdropFilter: "blur(8px)",
          borderRadius: "var(--radius-full)",
          border: `1px solid ${isScanning ? "rgba(170, 199, 159, 0.7)" : "rgba(255,255,255,0.12)"}`,
          transition: "all 0.3s ease",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isScanning ? "#e7f1df" : "rgba(255,255,255,0.92)",
          }}
        >
          {isScanning ? "Analyzing your tray..." : instruction}
        </p>
      </div>
    </div>
  );
}
