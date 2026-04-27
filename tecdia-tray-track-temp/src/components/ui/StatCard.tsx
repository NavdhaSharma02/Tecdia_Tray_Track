import Card from "./Card";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  glowing?: boolean;
}

/**
 * Dashboard stat card with icon, value, and label.
 */
export default function StatCard({
  icon,
  label,
  value,
  subtext,
  glowing = false,
}: StatCardProps) {
  return (
    <Card variant="glass" className={glowing ? "border-glow" : ""}>
      <div className="flex items-start justify-between mb-3">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(180deg, rgba(43, 29, 24, 0.08), rgba(187, 129, 105, 0.12))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent-deep)",
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.2,
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-secondary)",
          marginTop: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      {subtext && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "4px",
          }}
        >
          {subtext}
        </div>
      )}
    </Card>
  );
}
