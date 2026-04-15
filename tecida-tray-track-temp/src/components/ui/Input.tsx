import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Styled Input component using the design system.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn("input", error && "!border-[var(--danger)]", className)}
          {...props}
        />
        {error && (
          <span style={{ fontSize: "12px", color: "var(--danger)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
