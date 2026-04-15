"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import MenuItemForm from "./MenuItemForm";
import { formatCurrency } from "@/lib/utils";
import { FOOD_CATEGORIES } from "@/lib/constants";
import * as api from "@/services/api";
import type { MenuItem } from "@/types";

/**
 * Admin menu item management table — no emojis.
 */
export default function MenuEditor() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    api.getMenuItems().then((res) => {
      if (res.ok && res.data) setItems(res.data);
      setLoading(false);
    });
  }, []);

  const categories = ["All", ...new Set(items.map((i) => i.category))];

  const filtered =
    filter === "All" ? items : items.filter((i) => i.category === filter);

  const handleSave = (item: MenuItem) => {
    if (editItem) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    } else {
      setItems((prev) => [...prev, item]);
    }
    setEditItem(null);
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    api.deleteMenuItem(id);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`btn ${filter === cat ? "btn-primary" : "btn-outline"} btn-sm`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Button variant="primary" size="md" onClick={() => setShowAdd(true)}>
          + Add Item
        </Button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Calories</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}>
                    <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  No items found
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                  </td>
                  <td>
                    <Badge variant="accent">{item.category}</Badge>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {formatCurrency(item.price)}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {item.calories} cal
                  </td>
                  <td>
                    <Badge variant={item.available ? "success" : "danger"}>
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditItem(item)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: "13px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--danger)", fontSize: "13px" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAdd || !!editItem}
        onClose={() => { setShowAdd(false); setEditItem(null); }}
        title={editItem ? "Edit Menu Item" : "Add Menu Item"}
      >
        <MenuItemForm
          item={editItem}
          onSave={handleSave}
          onCancel={() => { setShowAdd(false); setEditItem(null); }}
        />
      </Modal>
    </div>
  );
}
