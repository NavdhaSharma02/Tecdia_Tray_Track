interface TecdiaLogoProps {
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  showLines?: boolean;
}

const sizeMap = {
  sm: {
    width: 72,
  },
  md: {
    width: 128,
  },
  lg: {
    width: 184,
  },
} as const;

const LOGO_SRC = "/logo_tecdia.png?v=20260418-132407";

export default function TecdiaLogo({
  size = "md",
  align = "center",
  showLines = true,
}: TecdiaLogoProps) {
  void showLines;
  const width = sizeMap[size].width;

  return (
    <div
      style={{
        display: "inline-flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        width,
        lineHeight: 0,
      }}
    >
      <img
        src={LOGO_SRC}
        alt="Tecdia Cebu Inc."
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </div>
  );
}
