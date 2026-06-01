"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import {
  FOOD_CATEGORIES,
  RICE_BIG_CATEGORY,
  RICE_BIG_NAME,
  RICE_SMALL_CATEGORY,
  RICE_SMALL_NAME,
  SEBAW_MENU_NAME,
  SOUP_CATEGORY,
  isCompactDishName,
  isPermanentRiceMenuItem,
  isSebawMenuItem,
} from "@/lib/constants";
import type { MenuItem } from "@/types";

interface MenuItemFormProps {
  item?: MenuItem | null;
  defaultCategory?: string;
  onSave: (item: MenuItem, referenceImages?: File[] | null) => void;
  onCancel: () => void;
}

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
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [referenceError, setReferenceError] = useState<string | undefined>();

  const isSoupItem = category === SOUP_CATEGORY;
  const existingImageUrls =
    item?.referenceImageUrls?.length
      ? item.referenceImageUrls
      : item?.image
        ? [item.image]
        : [];
  const previewUrls = useMemo(
    () =>
      referenceFiles.length
        ? referenceFiles.map((file) => URL.createObjectURL(file))
        : existingImageUrls,
    [existingImageUrls, referenceFiles]
  );

  useEffect(() => {
    if (!referenceFiles.length) return;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls, referenceFiles.length]);

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
    if (
      category === RICE_BIG_CATEGORY ||
      category === RICE_SMALL_CATEGORY ||
      trimmedName === RICE_BIG_NAME ||
      trimmedName === RICE_SMALL_NAME
    ) {
      setNameError("Rice portions are managed in the Rice portions panel above.");
      return;
    }
    if (!isCompactDishName(trimmedName)) {
      setNameError("Use lowercase letters only; separate words with spaces.");
      return;
    }
    setNameError(undefined);

    const hasExistingReference = Boolean(
      item?.hasReferencePhoto || item?.image || (item?.referenceImageUrls?.length ?? 0) > 0
    );
    if (!isSoupItem && !hasExistingReference && referenceFiles.length < 4) {
      setReferenceError("Upload at least 4 reference photos.");
      return;
    }
    if (referenceFiles.length > 0 && referenceFiles.length < 4) {
      setReferenceError("Upload at least 4 reference photos.");
      return;
    }
    setReferenceError(undefined);

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
      hasReferencePhoto: item?.hasReferencePhoto,
    };
    onSave(menuItem, referenceFiles.length ? referenceFiles : null);
  };

  if (item && (isSebawMenuItem(item) || isPermanentRiceMenuItem(item))) {
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
          {FOOD_CATEGORIES.filter(
            (c) => c !== "All" && c !== RICE_BIG_CATEGORY && c !== RICE_SMALL_CATEGORY
          ).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <ReferencePhotoSection
        previewUrls={previewUrls}
        hasEmbedding={item?.hasEmbedding}
        fileCount={referenceFiles.length}
        error={referenceError}
        onPickFiles={(files) => {
          setReferenceFiles(files);
          if (referenceError) setReferenceError(undefined);
        }}
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
          placeholder={isSoupItem ? "e.g. tomato soup" : "e.g. chicken teriyaki"}
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
            Price
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
  previewUrls,
  hasEmbedding,
  fileCount,
  error,
  onPickFiles,
  optional,
}: {
  previewUrls: string[];
  hasEmbedding?: boolean;
  fileCount: number;
  error?: string;
  onPickFiles: (files: File[]) => void;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
        Reference photos{optional ? " (optional)" : ""} - minimum 4
      </label>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
        {optional
          ? "Upload at least 4 photos if this soup should be detected on the tray scanner."
          : "Upload at least 4 photos of the dish as it is usually served. The first photo is used as the preview; all photos improve the vision reference."}
      </p>
      {previewUrls.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
            gap: "8px",
            maxWidth: "460px",
          }}
        >
          {previewUrls.map((previewUrl, index) => (
            <div
              key={`${previewUrl}-${index}`}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid var(--border)",
                aspectRatio: "1 / 1",
                background: "var(--bg-elevated)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Reference preview ${index + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>
      )}
      {fileCount > 0 && (
        <span style={{ fontSize: "12px", color: fileCount >= 4 ? "var(--success)" : "var(--danger)" }}>
          {fileCount} photo{fileCount === 1 ? "" : "s"} selected
        </span>
      )}
      {error && (
        <span style={{ fontSize: "12px", color: "var(--danger)" }}>{error}</span>
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
        multiple
        onChange={(e) => onPickFiles(Array.from(e.target.files ?? []))}
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