"use client";

import { useState, useMemo } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { ScannedItem } from "@/types";

/**
 * Food Detection Results step — card-based layout, no emojis.
 */
export default function FoodResults() {
  const { scannedItems, updateItems, selectPayment } = useCustomerFlow();
  const [items, setItems] = useState<ScannedItem[]>(scannedItems);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const totalCaloriesKnown = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (item.calories == null) return sum;
        return sum + item.calories * item.quantity;
      }, 0),
    [items]
  );
  const anyUnknownCalories = useMemo(
    () => items.some((item) => item.calories == null),
    [items]
  );

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProceed = () => {
    updateItems(items);
    selectPayment("immediate");
  };

  const cardColors = [
    "rgba(94, 139, 58, 0.06)",
    "rgba(229, 150, 59, 0.06)",
    "rgba(94, 139, 58, 0.04)",
    "rgba(229, 150, 59, 0.04)",
  ];

  return (
    <div
      className="animate-slide-up"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        minHeight: "100%",
        height: "100%",
        padding: "8px 20px 18px",
        maxWidth: "750px",
        margin: "0 auto",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "34px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Items Detected
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "2px" }}>
            {items.length} items found on your tray
          </p>
        </div>
        <Badge variant="success">Scan Complete</Badge>
      </div>

      {/* Food Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`animate-scale-pop stagger-${idx + 1}`}
            style={{
              background: `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.74)), ${cardColors[idx % cardColors.length]}`,
              borderRadius: "32px",
              padding: "16px",
              border: "1px solid var(--border)",
              position: "relative",
              opacity: 0,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "var(--shadow-sm)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Remove button */}
            <button
              onClick={() => removeItem(item.id)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              title="Remove item"
            >
              x
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "14px",
                marginBottom: "14px",
                paddingRight: "36px",
              }}
            >
              {/* Category indicator */}
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}
              >
                {item.category}
              </div>

              {/* Food image placeholder for future item photos */}
              <div
                aria-label={`${item.name} image placeholder`}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "18px",
                  border: "1px dashed rgba(94, 139, 58, 0.35)",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(94, 139, 58, 0.08))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "6px",
                  color: "var(--text-muted)",
                  fontSize: "10px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  flexShrink: 0,
                }}
              >
                Add photo
              </div>
            </div>

            {/* Item details */}
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {item.name}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {item.calories} cal
              </span>
              <Badge variant="success">
                {Math.round(item.confidence * 100)}%
              </Badge>
            </div>

            {/* Price + Quantity */}
            <div className="flex items-center justify-between">
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--accent)",
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1.15,
                }}
              >
                {formatCurrency(item.price * item.quantity)}
              </p>

              <div
                className="flex items-center gap-1"
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-full)",
                  padding: "4px",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  -
                </button>
                <span
                  style={{
                    width: "28px",
                    textAlign: "center",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: "var(--accent)",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div
          style={{
            padding: "60px",
            textAlign: "center",
            color: "var(--text-muted)",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
          }}
        >
          No items remaining. Please go back and scan again.
        </div>
      )}

      {/* Total + CTA */}
      {items.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            background: "var(--bg-elevated)",
            borderRadius: "32px",
            padding: "18px 22px",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Total — {items.length} item{items.length === 1 ? "" : "s"}
              {!anyUnknownCalories ? ` · ${totalCaloriesKnown} cal` : ""}
              {anyUnknownCalories ? " · calorie total N/A" : ""}
            </p>
            <p
              style={{
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.15,
                paddingBottom: "4px",
              }}
            >
              {formatCurrency(total)}
            </p>
          </div>

          <Button
            variant="primary"
            size="xl"
            onClick={handleProceed}
            style={{ fontSize: "17px", minWidth: "220px" }}
          >
            Proceed to Payment
          </Button>
        </div>
      )}
    </div>
  );
}
