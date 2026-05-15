"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  FOOD_CATEGORIES,
  SEBAW_MENU_NAME,
  SOUP_CATEGORY,
  isSebawMenuItem,
} from "@/lib/constants";
import type { MenuItem } from "@/types";

interface MenuItemFormProps {
  item?: MenuItem | null;
  defaultCategory?: string;
  onSave: (item: MenuItem, referenceImage?: File | null) => void;
  onCancel: () => void;
}

/**
 * Add/Edit menu item form (main course or priced soup).
 * Sebaw is configured separately via SebawPanel.
 */
export default function MenuItemForm({
  item,
  defaultCategory,
  onSave,
  onCancel,
}: MenuItemFormProps) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(
    item?.category || defaultCategory || "Main Course"
  );
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [calories, setCalories] = useState(
    item?.calories == null ? "N/A" : String(item.calories)
  );
  const [available, setAvailable] = useState(item?.available ?? true);
  const [caloriesError, setCaloriesError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.image || null);

  const isSoupItem = category === SOUP_CATEGORY;

  useEffect(() => {
    if (!referenceFile) return;
    const url = URL.createObjectURL(referenceFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [referenceFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required.");
      return;
    }
    if (trimmedName.toLowerCase() === SEBAW_MENU_NAME.toLowerCase()) {
      setNameError(`"${SEBAW_MENU_NAME}" is reserved for free soup. Use the Sebaw panel above.`);
      return;
    }
    setNameError(undefined);

    const trimmedCal = calories.trim();
    let caloriesValue: number | null;
    if (trimmedCal === "" || trimmedCal.toLowerCase() === "n/a") {
      caloriesValue = null;
      setCaloriesError(undefined);
    } else {
      const n = Number.parseInt(trimmedCal, 10);
      if (Number.isNaN(n) || n < 0) {
        setCaloriesError("Enter a whole number or N/A");
        return;
      }
      caloriesValue = n;
      setCaloriesError(undefined);
    }

    const menuItem: MenuItem = {
      id: item?.id || "",
      name: trimmedName,
      category,
      price: parseFloat(price) || 0,
      calories: caloriesValue,
      image: item?.image || null,
      available,
      hasEmbedding: item?.hasEmbedding,
    };
    onSave(menuItem, referenceFile);
  };

  if (item && isSebawMenuItem(item)) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
          style={{ cursor: "pointer" }}
        >
          {FOOD_CATEGORIES.filter((c) => c !== "All").map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <ReferencePhotoSection
        previewUrl={previewUrl}
        hasEmbedding={item?.hasEmbedding}
        onPickFile={setReferenceFile}
        optional={isSoupItem}
      />

      <div className="flex flex-col gap-2">
        <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
          Item Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(undefined);
          }}
          placeholder={isSoupItem ? "e.g. Tomato Soup" : "e.g. Chicken Teriyaki"}
          className="input"
          required
        />
        {nameError && (
          <span style={{ fontSize: "12px", color: "var(--danger)" }}>{nameError}</span>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Price (₹)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="input"
            min="0"
            required
          />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
            Calories
          </label>
          <input
            type="text"
            value={calories}
            onChange={(e) => {
              setCalories(e.target.value);
              if (caloriesError) setCaloriesError(undefined);
            }}
            placeholder="e.g. 350 or N/A"
            className="input"
            autoComplete="off"
          />
          {caloriesError && (
            <span style={{ fontSize: "12px", color: "var(--danger)" }}>{caloriesError}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="available-toggle"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }}
        />
        <label
          htmlFor="available-toggle"
          style={{ fontSize: "14px", color: "var(--text-primary)", cursor: "pointer" }}
        >
          Available for ordering
        </label>
      </div>

      <FormActions isEdit={!!item} onCancel={onCancel} />
    </form>
  );
}

function ReferencePhotoSection({
  previewUrl,
  hasEmbedding,
  onPickFile,
  optional,
}: {
  previewUrl: string | null;
  hasEmbedding?: boolean;
  onPickFile: (file: File | null) => void;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
        Reference photo{optional ? " (optional)" : ""} — saved permanently
      </label>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
        {optional
          ? "Upload if this soup should be detected on the tray scanner."
          : "Photograph the dish as it is usually served. The photo is kept on this tablet and reused on future days; vision must show Ready for scanning."}
      </p>
      {previewUrl && (
        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--border)",
            maxWidth: "220px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Reference preview"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      )}
      {hasEmbedding && (
        <span style={{ fontSize: "12px", color: "var(--success)" }}>
          Embedding ready for today&apos;s scans
        </span>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        className="input"
      />
    </div>
  );
}

function FormActions({
  isEdit,
  onCancel,
}: {
  isEdit: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-3 mt-4">
      <Button type="button" variant="outline" size="md" onClick={onCancel} className="flex-1">
        Cancel
      </Button>
      <Button type="submit" variant="primary" size="md" className="flex-1">
        {isEdit ? "Save Changes" : "Add Item"}
      </Button>
    </div>
  );
}
