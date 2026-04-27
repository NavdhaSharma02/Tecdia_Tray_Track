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
  const { scannedItems, updateItems, goToPayment } = useCustomerFlow();
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
    goToPayment();
  };

  const cardColors = [
    "rgba(94, 139, 58, 0.06)",
    "rgba(229, 150, 59, 0.06)",
    "rgba(94, 139, 58, 0.04)",
    "rgba(229, 150, 59, 0.04)",
  ];

  return (
    <div
      className="animate-slide-up customer-results-view"
      style={{
        minHeight: "100%",
        height: "100%",
        maxWidth: "860px",
        margin: "0 auto",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        direction: "rtl",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          minHeight: "100%",
          padding: "12px 24px 22px 12px",
          direction: "ltr",
        }}
      >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            style={{
              fontSize: "clamp(2.35rem, 4.4vw, 3.2rem)",
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 10px 26px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.28)",
            }}
          >
            Items Detected
          </h2>
          <p
            style={{
              display: "inline-flex",
              width: "fit-content",
              maxWidth: "100%",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.72)",
              border: "1px solid rgba(109, 76, 64, 0.12)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              fontSize: "15px",
              color: "#1f1511",
              marginTop: "6px",
              textShadow: "none",
            }}
          >
            {items.length} items found on your tray
          </p>
        </div>
        <Badge
          variant="success"
          className="!text-[var(--text-primary)]"
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            border: "1px solid rgba(109, 76, 64, 0.14)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 12px 24px rgba(67, 41, 33, 0.1)",
          }}
        >
          Scan Complete
        </Badge>
      </div>

      {/* Food Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`animate-scale-pop stagger-${idx + 1}`}
            style={{
              background: `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.74)), ${cardColors[idx % cardColors.length]}`,
              borderRadius: "36px",
              padding: "18px",
              border: "1px solid var(--border)",
              position: "relative",
              opacity: 0,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "var(--shadow-md)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Remove button */}
            <button
              onClick={() => removeItem(item.id)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
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
                gap: "16px",
                marginBottom: "16px",
                paddingRight: "40px",
              }}
            >
              {/* Category indicator */}
              <div
                style={{
                  display: "inline-block",
                padding: "5px 12px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255,251,248,0.88)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                flexShrink: 0,
              }}
              >
                {item.category}
              </div>

              {/* Food image placeholder for future item photos */}
              <div
                aria-label={`${item.name} image placeholder`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "20px",
                  border: "1px dashed rgba(94, 139, 58, 0.35)",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(94, 139, 58, 0.08))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "6px",
                  color: "var(--text-muted)",
                  fontSize: "11px",
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
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              {item.name}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
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
                  fontSize: "22px",
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
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "18px",
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
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "var(--accent)",
                    cursor: "pointer",
                    fontSize: "18px",
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
            padding: "72px",
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
            marginTop: "2px",
                background: "linear-gradient(180deg, rgba(255,251,247,0.92), rgba(248,238,231,0.88))",
                borderRadius: "36px",
                padding: "22px 26px",
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
              <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>
              Total — {items.length} item{items.length === 1 ? "" : "s"}
              {!anyUnknownCalories ? ` · ${totalCaloriesKnown} cal` : ""}
              {anyUnknownCalories ? " · calorie total N/A" : ""}
            </p>
            <p
              style={{
                fontSize: "36px",
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
            style={{ fontSize: "18px", minWidth: "240px", transform: "translateY(-4px)" }}
          >
            Proceed to Payment
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
