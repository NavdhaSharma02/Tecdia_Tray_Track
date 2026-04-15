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
          width: "75%",
          height: "60%",
          maxWidth: "600px",
          maxHeight: "400px",
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
              width: "40px",
              height: "40px",
              ...pos,
              borderColor: isScanning ? "var(--success)" : "var(--accent)",
              transition: "border-color 0.3s ease",
            } as React.CSSProperties}
          />
        ))}

        {/* Center dashed border */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: `2px dashed ${isScanning ? "var(--success)" : "rgba(108, 92, 231, 0.4)"}`,
            borderRadius: "var(--radius-md)",
            transition: "border-color 0.3s ease",
          }}
        />

        {/* Scanning line */}
        {isScanning && (
          <div
            style={{
              position: "absolute",
              left: "20px",
              right: "20px",
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
                inset: "-10px",
                border: "2px solid var(--success)",
                borderRadius: "var(--radius-lg)",
                animation: "scan-ring 1.5s ease-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "-10px",
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
          marginTop: "24px",
          padding: "10px 24px",
          background: isScanning
            ? "rgba(45, 57, 42, 0.74)"
            : "rgba(10, 10, 15, 0.74)",
          backdropFilter: "blur(8px)",
          borderRadius: "var(--radius-full)",
          border: `1px solid ${isScanning ? "rgba(145, 179, 89, 0.8)" : "rgba(255,255,255,0.18)"}`,
          transition: "all 0.3s ease",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: isScanning ? "#b8db7b" : "rgba(255,255,255,0.92)",
          }}
        >
          {isScanning ? "Analyzing your tray..." : instruction}
        </p>
      </div>
    </div>
  );
}
