"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import type { MenuItem, ScannedItem } from "@/types";

interface StaffMenuAddPanelProps {
  billItems: ScannedItem[];
  onAdd: (menuItem: MenuItem) => void;
  title?: string;
}

/**
 * Cashier panel: pick items from today's menu that are not on the bill yet.
 */
export default function StaffMenuAddPanel({
  billItems,
  onAdd,
  title = "Add from today's menu",
}: StaffMenuAddPanelProps) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMenuLoading(true);
      const res = await api.getTodayMenu();
      if (cancelled) return;
      if (res.ok && res.data) {
        setMenu(res.data);
        setMenuError(null);
      } else {
        setMenuError(res.error || "Could not load today's menu.");
      }
      setMenuLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const billIds = useMemo(() => new Set(billItems.map((i) => i.id)), [billItems]);

  const notOnBill = useMemo(
    () => menu.filter((m) => !billIds.has(m.id)),
    [menu, billIds]
  );

  const categories = useMemo(() => {
    const cats = new Set(notOnBill.map((m) => m.category));
    return ["All", ...Array.from(cats).sort()];
  }, [notOnBill]);

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return notOnBill;
    return notOnBill.filter((m) => m.category === categoryFilter);
  }, [notOnBill, categoryFilter]);

  return (
    <div
      className="mb-4"
      style={{
        borderRadius: "var(--radius-lg)",
        background: "rgba(255, 251, 247, 0.94)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "14px 18px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
            {notOnBill.length} item{notOnBill.length === 1 ? "" : "s"} available to add
          </p>
        </div>
        <span style={{ fontSize: "18px", color: "var(--text-muted)" }}>
          {expanded ? "−" : "+"}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            padding: "0 18px 18px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {menuLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={28} />
            </div>
          ) : menuError ? (
            <p style={{ color: "var(--danger)", fontSize: "14px", margin: "12px 0 0" }}>
              {menuError}
            </p>
          ) : notOnBill.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "12px 0 0" }}>
              Every item on today&apos;s menu is already on this bill. Use + on a line to
              increase quantity.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2" style={{ marginTop: "14px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "999px",
                      border: `1px solid ${categoryFilter === cat ? "var(--accent)" : "var(--border)"}`,
                      background:
                        categoryFilter === cat ? "var(--accent)" : "rgba(255,255,255,0.9)",
                      color: categoryFilter === cat ? "#fff" : "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "8px",
                  marginTop: "12px",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                {filtered.map((menuItem) => (
                  <button
                    key={menuItem.id}
                    type="button"
                    onClick={() => onAdd(menuItem)}
                    style={{
                      padding: "10px",
                      borderRadius: "14px",
                      border: "1px solid var(--border)",
                      background: "rgba(255,255,255,0.98)",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "2px",
                      }}
                    >
                      {menuItem.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {formatCurrency(menuItem.price)}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
