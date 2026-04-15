import Spinner from "@/components/ui/Spinner";

/**
 * Global loading fallback.
 */
export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "16px",
      }}
    >
      <Spinner size={36} />
      <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading...</p>
    </div>
  );
}
