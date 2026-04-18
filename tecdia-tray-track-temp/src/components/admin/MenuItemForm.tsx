"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { FOOD_CATEGORIES } from "@/lib/constants";
import type { MenuItem } from "@/types";

interface MenuItemFormProps {
  item?: MenuItem | null;
  onSave: (item: MenuItem) => void;
  onCancel: () => void;
}

/**
 * Add/Edit menu item form used inside a modal.
 */
export default function MenuItemForm({ item, onSave, onCancel }: MenuItemFormProps) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "Main Course");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [calories, setCalories] = useState(
    item?.calories == null ? "N/A" : String(item.calories)
  );
  const [available, setAvailable] = useState(item?.available ?? true);
  const [caloriesError, setCaloriesError] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      name,
      category,
      price: parseFloat(price) || 0,
      calories: caloriesValue,
      image: null,
      available,
    };
    onSave(menuItem);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
          Item Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Paneer Butter Masala"
          className="input"
          required
        />
      </div>

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

      <div className="flex gap-3 mt-4">
        <Button type="button" variant="outline" size="md" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" className="flex-1">
          {item ? "Save Changes" : "Add Item"}
        </Button>
      </div>
    </form>
  );
}
