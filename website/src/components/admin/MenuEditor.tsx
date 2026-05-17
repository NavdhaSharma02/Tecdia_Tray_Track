"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import MenuItemForm from "./MenuItemForm";
import SebawPanel from "./SebawPanel";
import RicePanel from "./RicePanel";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import {
  FOOD_CATEGORIES,
  RICE_BIG_CATEGORY,
  RICE_SMALL_CATEGORY,
  SOUP_CATEGORY,
  isPermanentRiceMenuItem,
  isRiceBigMenuItem,
  isRiceSmallMenuItem,
  isSebawMenuItem,
} from "@/lib/constants";
import type { MenuItem } from "@/types";

type MenuView = "all" | "today";

export default function MenuEditor() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("All");
  const [activeView, setActiveView] = useState<MenuView>("all");
  const [listError, setListError] = useState<string | null>(null);
  const [listNotice, setListNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rebuildingVision, setRebuildingVision] = useState(false);
  const [importingVision, setImportingVision] = useState(false);
  const [addingTodayId, setAddingTodayId] = useState<string | null>(null);

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
    const load = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(load);
  }, [loadItems]);

  const categories = [...FOOD_CATEGORIES];
  const sebawItem = items.find((item) => isSebawMenuItem(item)) ?? null;
  const riceBigItem = items.find((item) => isRiceBigMenuItem(item)) ?? null;
  const riceSmallItem = items.find((item) => isRiceSmallMenuItem(item)) ?? null;
  const tableItems = items.filter(
    (item) => !isSebawMenuItem(item) && !isPermanentRiceMenuItem(item)
  );
  const filteredItems =
    filter === "All"
      ? tableItems
      : tableItems.filter((item) => item.category === filter);
  const todayItems = tableItems.filter((item) => item.available);
  const showSebawPanel =
    activeView === "today" || filter === "All" || filter === SOUP_CATEGORY;
  const showRicePanel =
    activeView === "today" ||
    filter === "All" ||
    filter === RICE_BIG_CATEGORY ||
    filter === RICE_SMALL_CATEGORY;

  const handleSave = async (item: MenuItem, referenceImages?: File[] | null) => {
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

    if (referenceImages?.length && menuItemId) {
      const up = await api.uploadMenuItemReferenceImage(menuItemId, referenceImages);
      if (!up.ok) {
        setListError(
          up.error ||
            "Item saved but reference photos failed. Edit the item and upload again."
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

  /** Hide dish from today's tray flow without dropping the catalog link. */
  const handleRemoveFromToday = async (id: string) => {
    const item = items.find((row) => row.id === id);
    if (!item) return;

    setListError(null);
    const res = await api.updateMenuItem(id, { ...item, available: false });
    if (!res.ok) {
      setListError(res.error || "Could not remove dish from today's menu.");
      return;
    }
    await loadItems();
  };

  const handleAddExistingToToday = async (item: MenuItem) => {
    setListError(null);
    setAddingTodayId(item.id);
    const res = await api.updateMenuItem(item.id, { ...item, available: true });
    setAddingTodayId(null);

    if (!res.ok) {
      setListError(res.error || "Could not add dish to today's menu.");
      return;
    }

    await loadItems();
  };

  const openAdd = () => {
    setEditItem(null);
    setShowAdd(true);
  };

  const openAddToday = () => {
    setFilter("All");
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
        `Vision ready for ${succeeded} of ${processed} photo(s). ${failed.length} failed. Run npm run ml:setup, then try Rebuild vision again.`
      );
    }
    await loadItems();
  };

  const handleImportVisionBank = async () => {
    setListError(null);
    setListNotice(null);
    setImportingVision(true);
    const res = await api.importVisionTrainingBank();
    setImportingVision(false);
    if (!res.ok || !res.data) {
      setListError(res.error || "Could not import training embeddings.");
      return;
    }
    const { skipped, reason, inserted, matched, totalPrototypesInBank, unmatchedClasses } =
      res.data;
    if (skipped) {
      setListNotice(reason || "Training bank already up to date.");
    } else {
      const unmatched =
        unmatchedClasses.length > 0
          ? ` ${unmatchedClasses.length} training label(s) are stored by name and will match when those dishes exist in the menu catalog.`
          : "";
      setListNotice(
        `Imported ${inserted} new prototype(s). ${totalPrototypesInBank} total in bank (${matched} linked to catalog items).${unmatched}`
      );
    }
    await loadItems();
  };

  return (
    <div>
      {listError && (
        <p className="mb-4" style={{ color: "var(--danger)", fontSize: "14px" }}>
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

      {showRicePanel && (
        <RicePanel
          riceBigItem={riceBigItem}
          riceSmallItem={riceSmallItem}
          onSaved={() => void loadItems()}
        />
      )}

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView("all")}
            className={`btn ${activeView === "all" ? "btn-primary" : "btn-outline"} btn-sm`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveView("today")}
            className={`btn ${activeView === "today" ? "btn-primary" : "btn-outline"} btn-sm`}
          >
            Today&apos;s menu
          </button>
        </div>
        <Button
          variant="outline"
          size="md"
          disabled={importingVision || rebuildingVision}
          onClick={() => void handleImportVisionBank()}
        >
          {importingVision ? "Importing..." : "Import training bank"}
        </Button>
        <Button
          variant="outline"
          size="md"
          disabled={rebuildingVision || importingVision}
          onClick={() => void handleRebuildVision()}
        >
          {rebuildingVision ? "Rebuilding..." : "Rebuild vision"}
        </Button>
      </div>

      {activeView === "all" ? (
        <AllMenuView
          categories={categories}
          filter={filter}
          items={filteredItems}
          loading={loading}
          onFilterChange={setFilter}
          onAdd={openAdd}
          onEdit={setEditItem}
          onDelete={handleDelete}
        />
      ) : (
        <TodayMenuView
          items={todayItems}
          allItems={tableItems}
          loading={loading}
          onAdd={openAddToday}
          onAddExisting={handleAddExistingToToday}
          onEdit={setEditItem}
          onDelete={handleRemoveFromToday}
          addingTodayId={addingTodayId}
        />
      )}

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
          Saving and computing embedding...
        </p>
      )}
    </div>
  );
}

function AllMenuView({
  categories,
  filter,
  items,
  loading,
  onFilterChange,
  onAdd,
  onEdit,
  onDelete,
}: {
  categories: string[];
  filter: string;
  items: MenuItem[];
  loading: boolean;
  onFilterChange: (filter: string) => void;
  onAdd: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onFilterChange(category)}
              className={`btn ${filter === category ? "btn-primary" : "btn-outline"} btn-sm`}
            >
              {category}
            </button>
          ))}
        </div>
        {filter !== RICE_BIG_CATEGORY && filter !== RICE_SMALL_CATEGORY && (
          <Button variant="primary" size="md" onClick={onAdd}>
            {filter === SOUP_CATEGORY ? "+ Add Soup" : "+ Add Item"}
          </Button>
        )}
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

      {(filter === RICE_BIG_CATEGORY || filter === RICE_SMALL_CATEGORY) && (
        <p
          className="mb-4"
          style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.45 }}
        >
          Rice prices are set in the Rice portions panel above. These categories are always on
          today&apos;s menu.
        </p>
      )}

      <MenuItemsTable
        items={items}
        loading={loading}
        emptyText={
          filter === SOUP_CATEGORY
            ? "No priced soups yet. Add one with name and price."
            : "No items found"
        }
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}

function TodayMenuView({
  items,
  allItems,
  loading,
  onAdd,
  onAddExisting,
  onEdit,
  onDelete,
  addingTodayId,
}: {
  items: MenuItem[];
  allItems: MenuItem[];
  loading: boolean;
  onAdd: () => void;
  onAddExisting: (item: MenuItem) => Promise<void>;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => Promise<void>;
  addingTodayId: string | null;
}) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const searchResults =
    normalizedSearch.length === 0
      ? []
      : allItems.filter(
          (item) =>
            !item.available &&
            `${item.name} ${item.category}`.toLowerCase().includes(normalizedSearch)
        );

  return (
    <section
      className="card-elevated"
      style={{ padding: "24px", display: "grid", gap: "18px" }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Today&apos;s menu
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              color: "var(--text-muted)",
            }}
          >
            Add dishes that should be available on the customer tray flow today.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onAdd}>
          + Add Today&apos;s Dish
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "12px",
          padding: "16px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          background: "rgba(255, 252, 248, 0.72)",
        }}
      >
        <label
          htmlFor="today-menu-search"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text-secondary)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Search dishes from All
        </label>
        <input
          id="today-menu-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input"
          autoComplete="off"
        />

        {searchResults.length > 0 && (
          <div style={{ display: "grid", gap: "8px" }}>
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3"
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.72)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                    {item.category} · {formatCurrency(item.price)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={addingTodayId === item.id}
                  onClick={() => void onAddExisting(item)}
                >
                  {addingTodayId === item.id ? "Adding..." : "Add to today"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <MenuItemsTable
        items={items}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </section>
  );
}

function MenuItemsTable({
  items,
  loading,
  emptyText,
  onEdit,
  onDelete,
}: {
  items: MenuItem[];
  loading: boolean;
  emptyText?: string;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
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
            Array.from({ length: 4 }).map((_, index) => (
              <tr key={index}>
                <td colSpan={7}>
                  <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                </td>
              </tr>
            ))
          ) : items.length === 0 ? (
            emptyText ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : null
          ) : (
            items.map((item) => (
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
                      ? item.embeddingCount && item.embeddingCount > 1
                        ? `Ready (${item.embeddingCount})`
                        : "Ready"
                      : item.hasReferencePhoto
                        ? "Photo saved"
                        : item.category === SOUP_CATEGORY ||
                            item.category === RICE_BIG_CATEGORY ||
                            item.category === RICE_SMALL_CATEGORY
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
                      type="button"
                      onClick={() => onEdit(item)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "13px" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(item.id)}
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
  );
}
