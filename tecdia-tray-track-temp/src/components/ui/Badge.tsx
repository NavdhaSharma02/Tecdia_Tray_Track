import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "accent" | "success" | "warning" | "danger";
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
  ...props
}: BadgeProps) {
  return (
    <span className={cn("badge", variantMap[variant], className)} {...props}>
      {children}
    </span>
  );
}
