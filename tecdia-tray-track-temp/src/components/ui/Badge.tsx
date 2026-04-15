import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "accent" | "success" | "warning" | "danger";
  className?: string;
}

const variantMap: Record<string, string> = {
  accent: "badge-accent",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
};

/**
 * Small status/category badge using the design system.
 */
export default function Badge({
  children,
  variant = "accent",
  className,
}: BadgeProps) {
  return (
    <span className={cn("badge", variantMap[variant], className)}>
      {children}
    </span>
  );
}
