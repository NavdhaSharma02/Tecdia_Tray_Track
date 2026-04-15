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
            background: "var(--accent-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "var(--text-primary)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          marginTop: "4px",
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
