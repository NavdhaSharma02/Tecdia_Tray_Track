import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "glass" | "elevated";
  className?: string;
  padding?: boolean;
}

const variantMap: Record<string, string> = {
  default: "card",
  glass: "glass-card",
  elevated: "card-elevated",
};

/**
 * Reusable Card component using the design system.
 */
export default function Card({
  children,
  variant = "default",
  className,
  padding = true,
}: CardProps) {
  return (
    <div className={cn(variantMap[variant], padding && "p-6", className)}>
      {children}
    </div>
  );
}
