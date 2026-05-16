"use client";

import { useMemo, useState } from "react";
import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StaffMenuAddPanel from "@/components/customer/StaffMenuAddPanel";
import { formatCurrency } from "@/lib/utils";
import { addMenuItemToBill } from "@/lib/manual-bill";
import type { MenuItem, ScannedItem } from "@/types";

/**
 * Cashier manual billing — build the bill from today's menu (no tray scan).
 */
export default function ManualBillingView() {
  const { scannedItems, updateItems, goToPayment, backToTrayScan } = useCustomerFlow();
  const [items, setItems] = useState<ScannedItem[]>(scannedItems);
  const [menuLookup, setMenuLookup] = useState<MenuItem[]>([]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const handleAdd = (menuItem: MenuItem) => {
    setMenuLookup((prev) =>
      prev.some((m) => m.id === menuItem.id) ? prev : [...prev, menuItem]
    );
    setItems((prev) => addMenuItemToBill(prev, menuItem, 1));
  };

  const handleQuantity = (id: string, delta: number) => {
    const menuItem = menuLookup.find((m) => m.id === id);
    if (!menuItem) {
      setItems((prev) =>
        prev
          .map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
          )
          .filter((i) => i.quantity > 0)
      );
      return;
    }
    setItems((prev) => addMenuItemToBill(prev, menuItem, delta));
  };

  const handleProceed = () => {
    updateItems(items);
    goToPayment();
  };

  return (
    <div
      className="animate-slide-up customer-results-view"
      style={{
        minHeight: "100%",
        maxWidth: "960px",
        margin: "0 auto",
        width: "100%",
        overflowY: "auto",
        padding: "12px 20px 24px",
      }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 10px 26px rgba(0,0,0,0.4)",
            }}
          >
            Manual billing
          </h2>
          <p
            style={{
              marginTop: "6px",
              fontSize: "15px",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Cashier mode — add items from today&apos;s menu
          </p>
        </div>
        <Badge variant="accent">Staff</Badge>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-2"
        style={{
          padding: "12px 14px",
          borderRadius: "var(--radius-lg)",
          background: "rgba(255, 251, 247, 0.92)",
          border: "1px solid var(--border)",
        }}
      >
        <Button variant="outline" size="sm" onClick={backToTrayScan}>
          Back to tray scan
        </Button>
      </div>

      <StaffMenuAddPanel billItems={items} onAdd={handleAdd} />

      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#fff",
          marginBottom: "10px",
          textShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        Bill ({items.length} line{items.length === 1 ? "" : "s"})
      </h3>

      {items.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            borderRadius: "var(--radius-xl)",
            background: "var(--bg-elevated)",
            border: "1px dashed var(--border)",
            color: "var(--text-muted)",
          }}
        >
          Expand the menu above and tap items to add them to the bill.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.96)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.name}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{item.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuantity(item.id, -1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid var(--border)",
                    background: "var(--bg-elevated)",
                    fontSize: "18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  −
                </button>
                <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantity(item.id, 1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: "18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
                <span
                  style={{
                    minWidth: "72px",
                    textAlign: "right",
                    fontWeight: 800,
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px 22px",
            borderRadius: "24px",
            background: "rgba(255,251,247,0.94)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <p
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              margin: 0,
            }}
          >
            {formatCurrency(total)}
          </p>
          <Button variant="primary" size="xl" onClick={handleProceed}>
            Proceed to Payment
          </Button>
        </div>
      )}
    </div>
  );
}
