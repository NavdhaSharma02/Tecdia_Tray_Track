"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { SEBAW_MENU_NAME } from "@/lib/constants";
import * as api from "@/services/api";
import type { MenuItem } from "@/types";

interface SebawPanelProps {
  sebawItem: MenuItem | null;
  onSaved: () => void;
}

/** Free meatless soup toggle — separate from priced soup menu items. */
export default function SebawPanel({ sebawItem, onSaved }: SebawPanelProps) {
  const [available, setAvailable] = useState(sebawItem?.available ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvailable(sebawItem?.available ?? false);
  }, [sebawItem]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await api.saveSebawToday(available);
    setSaving(false);
    if (!res.ok) {
      setError(res.error || "Could not save Sebaw.");
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              {SEBAW_MENU_NAME}
            </p>
            <Badge variant="accent">Free · Soup</Badge>
            {sebawItem && (
              <Badge variant={sebawItem.available ? "success" : "danger"}>
                {sebawItem.available ? "On menu today" : "Off menu today"}
              </Badge>
            )}
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "8px 0 0", lineHeight: 1.45 }}>
            Free meatless soup. When enabled, {SEBAW_MENU_NAME} appears on today&apos;s menu at no charge.
            Add priced soups separately below.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label
            className="flex items-center gap-2"
            style={{ fontSize: "14px", color: "var(--text-primary)", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
            />
            Available today
          </label>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Sebaw"}
          </Button>
        </div>
      </div>
      {error && (
        <p style={{ color: "var(--danger)", fontSize: "13px", margin: "12px 0 0" }}>{error}</p>
      )}
    </div>
  );
}
