interface TecdiaLogoProps {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  showLines?: boolean;
}

const sizeMap = {
  sm: {
    eyebrow: "12px",
    wordmark: "22px",
    subtext: "8px",
    gap: "4px",
  },
  md: {
    eyebrow: "13px",
    wordmark: "34px",
    subtext: "10px",
    gap: "5px",
  },
  lg: {
    eyebrow: "14px",
    wordmark: "42px",
    subtext: "12px",
    gap: "6px",
  },
};

export default function TecdiaLogo({
  size = "md",
  align = "center",
  showLines = true,
}: TecdiaLogoProps) {
  const styles = sizeMap[size];

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: showLines ? styles.gap : 0,
        lineHeight: 1,
      }}
    >
      {showLines && (
        <p
          style={{
            fontSize: styles.eyebrow,
            color: "#1d9cc4",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Let&apos;s do this.
        </p>
      )}
      <div
        style={{
          fontSize: styles.wordmark,
          lineHeight: 0.92,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "#1ea3cb",
          margin: 0,
        }}
      >
        TEC
        <div style={{ marginLeft: "0.16em" }}>DIA</div>
      </div>
      {showLines && (
        <p
          style={{
            fontSize: styles.subtext,
            color: "rgba(30, 163, 203, 0.78)",
            letterSpacing: "0.08em",
            fontWeight: 600,
            margin: 0,
          }}
        >
          TECDIA CEBU Inc.
        </p>
      )}
    </div>
  );
}
