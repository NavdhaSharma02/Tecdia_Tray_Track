"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { CURRENCY, RICE_BIG_NAME, RICE_SMALL_NAME } from "@/lib/constants";
import * as api from "@/services/api";
import type { MenuItem } from "@/types";

interface RicePanelProps {
  riceBigItem: MenuItem | null;
  riceSmallItem: MenuItem | null;
  onSaved: () => void;
}

/** Permanent rice categories — always on the menu with a set price. */
export default function RicePanel({ riceBigItem, riceSmallItem, onSaved }: RicePanelProps) {
  const [bigPrice, setBigPrice] = useState(riceBigItem?.price?.toString() ?? "");
  const [smallPrice, setSmallPrice] = useState(riceSmallItem?.price?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBigPrice(riceBigItem?.price?.toString() ?? "");
    setSmallPrice(riceSmallItem?.price?.toString() ?? "");
  }, [riceBigItem, riceSmallItem]);

  const handleSave = async () => {
    const rice_big = Number.parseFloat(bigPrice);
    const rice_small = Number.parseFloat(smallPrice);
    if (!Number.isFinite(rice_big) || rice_big < 0) {
      setError(`Enter a valid price for ${RICE_BIG_NAME}.`);
      return;
    }
    if (!Number.isFinite(rice_small) || rice_small < 0) {
      setError(`Enter a valid price for ${RICE_SMALL_NAME}.`);
      return;
    }

    setSaving(true);
    setError(null);
    const res = await api.savePermanentRicePrices({ rice_big, rice_small });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || "Could not save rice prices.");
      return;
    }
    onSaved();
  };

  return (
    <div
      className="mb-6"
      style={{
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        background: "var(--bg-secondary)",
      }}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Rice portions
          </p>
          <Badge variant="accent">Permanent · YOLO</Badge>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.45 }}>
          {RICE_BIG_NAME} and {RICE_SMALL_NAME} are always on today&apos;s menu. Set prices for tray
          detection billing.
        </p>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <RicePriceField
          label={RICE_BIG_NAME}
          value={bigPrice}
          onChange={setBigPrice}
          saved={riceBigItem != null}
        />
        <RicePriceField
          label={RICE_SMALL_NAME}
          value={smallPrice}
          onChange={setSmallPrice}
          saved={riceSmallItem != null}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap mt-4">
        <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save rice prices"}
        </Button>
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "13px", margin: "12px 0 0" }}>{error}</p>
      )}
    </div>
  );
}

function RicePriceField({
  label,
  value,
  onChange,
  saved,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  saved: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
        {label}
        {saved && (
          <span style={{ marginLeft: 8, fontSize: "11px", color: "var(--success)" }}>on menu</span>
        )}
      </label>
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>{CURRENCY}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          min="0"
          step="0.01"
          required
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}