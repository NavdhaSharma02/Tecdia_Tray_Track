"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import MenuItemForm from "./MenuItemForm";
import SebawPanel from "./SebawPanel";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import {
  FOOD_CATEGORIES,
  SOUP_CATEGORY,
  isSebawMenuItem,
} from "@/lib/constants";
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
  const [listError, setListError] = useState<string | null>(null);
  const [listNotice, setListNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rebuildingVision, setRebuildingVision] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setListError(null);
    setListNotice(null);
    const res = await api.getMenuItems();
    if (res.ok && res.data) {
      setItems(res.data);
    } else {
      setListError(res.error || "Could not load today's menu.");
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const categories = [...FOOD_CATEGORIES];
  const sebawItem = items.find((i) => isSebawMenuItem(i)) ?? null;

  const tableItems = items.filter((i) => !isSebawMenuItem(i));

  const filtered =
    filter === "All"
      ? tableItems
      : tableItems.filter((i) => i.category === filter);

  const showSebawPanel = filter === "All" || filter === SOUP_CATEGORY;

  const handleSave = async (item: MenuItem, referenceImage?: File | null) => {
    setListError(null);
    setSaving(true);
    let menuItemId = editItem?.id;

    if (editItem) {
      const res = await api.updateMenuItem(editItem.id, { ...item, id: editItem.id });
      if (!res.ok) {
        setListError(res.error || "Save failed.");
        setSaving(false);
        return;
      }
    } else {
      const { id: _id, ...rest } = item;
      void _id;
      const res = await api.createMenuItem(rest);
      if (!res.ok || !res.data) {
        setListError(res.error || "Could not add item.");
        setSaving(false);
        return;
      }
      menuItemId = res.data.id;
    }

    if (referenceImage && menuItemId) {
      const up = await api.uploadMenuItemReferenceImage(menuItemId, referenceImage);
      if (!up.ok) {
        setListError(
          up.error ||
            "Item saved but reference photo failed. Edit the item and upload again."
        );
        setSaving(false);
        await loadItems();
        return;
      }
      if (up.data?.warning) {
        setListNotice(up.data.warning);
      }
    }

    setSaving(false);
    setEditItem(null);
    setShowAdd(false);
    await loadItems();
  };

  const handleDelete = async (id: string) => {
    setListError(null);
    const res = await api.deleteMenuItem(id);
    if (!res.ok) {
      setListError(res.error || "Delete failed.");
      return;
    }
    await loadItems();
  };

  const openAdd = () => {
    setEditItem(null);
    setShowAdd(true);
  };

  const handleRebuildVision = async () => {
    setListError(null);
    setListNotice(null);
    setRebuildingVision(true);
    const res = await api.rebuildMenuReferenceEmbeddings();
    setRebuildingVision(false);
    if (!res.ok || !res.data) {
      setListError(res.error || "Could not rebuild vision embeddings.");
      return;
    }
    const { processed, succeeded, failed } = res.data;
    if (processed === 0) {
      setListNotice("No saved reference photos found on disk to rebuild.");
    } else if (failed.length === 0) {
      setListNotice(`Vision ready for ${succeeded} of ${processed} saved photo(s).`);
    } else {
      setListNotice(
        `Vision ready for ${succeeded} of ${processed} photo(s). ${failed.length} failed — run npm run ml:setup, then try Rebuild vision again.`
      );
    }
    await loadItems();
  };

  return (
    <div>
      {listError && (
        <p
          className="mb-4"
          style={{ color: "var(--danger)", fontSize: "14px" }}
        >
          {listError}
        </p>
      )}
      {listNotice && (
        <p
          className="mb-4"
          style={{ color: "var(--accent)", fontSize: "14px", lineHeight: 1.45 }}
        >
          {listNotice}
        </p>
      )}

      {showSebawPanel && (
        <SebawPanel sebawItem={sebawItem} onSaved={() => void loadItems()} />
      )}

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            disabled={rebuildingVision}
            onClick={() => void handleRebuildVision()}
          >
            {rebuildingVision ? "Rebuilding…" : "Rebuild vision"}
          </Button>
          <Button variant="primary" size="md" onClick={openAdd}>
            {filter === SOUP_CATEGORY ? "+ Add Soup" : "+ Add Item"}
          </Button>
        </div>
      </div>

      {filter === SOUP_CATEGORY && (
        <p
          className="mb-4"
          style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.45 }}
        >
          Priced soups appear in the table below. Use the Sebaw panel above for today&apos;s free
          soup.
        </p>
      )}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Calories</th>
              <th>Vision</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7}>
                    <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  {filter === SOUP_CATEGORY
                    ? "No priced soups yet. Add one with name and price."
                    : "No items found"}
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
                    {item.calories == null ? "N/A" : `${item.calories} cal`}
                  </td>
                  <td>
                    <Badge
                      variant={
                        item.hasEmbedding
                          ? "success"
                          : item.hasReferencePhoto
                            ? "warning"
                            : "danger"
                      }
                    >
                      {item.hasEmbedding
                        ? "Ready"
                        : item.hasReferencePhoto
                          ? "Photo saved"
                          : item.category === SOUP_CATEGORY
                            ? "Optional"
                            : "No photo"}
                    </Badge>
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
                        onClick={() => void handleDelete(item.id)}
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
        onClose={() => {
          setShowAdd(false);
          setEditItem(null);
        }}
        title={editItem ? "Edit Menu Item" : filter === SOUP_CATEGORY ? "Add Soup" : "Add Menu Item"}
      >
        <MenuItemForm
          item={editItem}
          defaultCategory={showAdd && !editItem && filter === SOUP_CATEGORY ? SOUP_CATEGORY : undefined}
          onSave={(item, ref) => void handleSave(item, ref)}
          onCancel={() => {
            setShowAdd(false);
            setEditItem(null);
          }}
        />
      </Modal>
      {saving && (
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
          Saving and computing embedding…
        </p>
      )}
    </div>
  );
}
