"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PinPadModal from "@/components/ui/PinPadModal";
import { getInitials } from "@/lib/utils";
import * as api from "@/services/api";
import type { AdminRole, AdminUser } from "@/types";

type UserFormState = {
  userCode: string;
  name: string;
  description: string;
  email: string;
  role: AdminRole;
  shift: string;
  status: "active" | "invited" | "suspended";
};

const emptyForm = (): UserFormState => ({
  userCode: "",
  name: "",
  description: "",
  email: "",
  role: "cashier",
  shift: "",
  status: "active",
});

/**
 * Admin access management table for system users like admins and cashiers.
 */
export default function UserTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "admin" | "cashier">("all");
  const [listError, setListError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setListError(null);
    const res = await api.getAdminUsers();
    if (res.ok && res.data) {
      setUsers(res.data);
    } else {
      setListError(res.error || "Could not load users.");
      setUsers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((user) => {
    const matchesRole = filter === "all" || user.role === filter;
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.shift.toLowerCase().includes(search.toLowerCase());

    return matchesRole && matchesSearch;
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm());
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      userCode: user.id,
      name: user.name,
      description: user.scope,
      email: user.email,
      role: user.role,
      shift: user.shift,
      status: user.status,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const requestSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    setFormError(null);
    setPendingAction("save");
    setPinModalOpen(true);
  };

  const requestDelete = (user: AdminUser) => {
    setDeleteTarget(user);
    setPendingAction("delete");
    setPinModalOpen(true);
  };

  const handlePinSubmit = async (adminPin: string) => {
    if (pendingAction === "delete" && deleteTarget) {
      const result = await api.deleteAdminUser(deleteTarget.id, adminPin);
      if (!result.ok) return { ok: false, error: result.error };
      setDeleteTarget(null);
      setPendingAction(null);
      setFormOpen(false);
      await loadUsers();
      return { ok: true };
    }

    if (pendingAction === "save") {
      const payload = {
        adminPin,
        userCode: form.userCode.trim() || undefined,
        name: form.name.trim(),
        description: form.description.trim(),
        email: form.email.trim(),
        role: form.role,
        shift: form.shift.trim(),
        status: form.status,
      };
      const result = editingUser
        ? await api.updateAdminUser(editingUser.id, payload)
        : await api.createAdminUser(payload);
      if (!result.ok) return { ok: false, error: result.error };
      setFormOpen(false);
      setEditingUser(null);
      setPendingAction(null);
      await loadUsers();
      return { ok: true };
    }

    return { ok: false, error: "No action pending." };
  };

  const closePinModal = () => {
    setPinModalOpen(false);
    if (pendingAction === "delete") {
      setDeleteTarget(null);
    }
    setPendingAction(null);
  };

  return (
    <div>
      {listError && (
        <p className="mb-4" style={{ color: "var(--danger)", fontSize: "14px" }}>
          {listError}
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, email, or shift..."
          className="input"
          style={{ maxWidth: "400px" }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "admin", "cashier"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`btn ${filter === role ? "btn-primary" : "btn-outline"} btn-sm`}
            >
              {role === "all" ? "All Access" : role === "admin" ? "Admins" : "Cashiers"}
            </button>
          ))}
          <Button variant="primary" size="sm" onClick={openCreate}>
            Add User
          </Button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>ID</th>
              <th>Role</th>
              <th>Email</th>
              <th>Shift</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7}>
                    <div
                      className="animate-shimmer"
                      style={{ height: "20px", borderRadius: "4px" }}
                    />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  No admin users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.scope}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{user.id}</span>
                  </td>
                  <td>
                    <Badge variant={user.role === "admin" ? "danger" : "warning"}>
                      {user.role === "admin" ? "Admin Access" : "Cashier Access"}
                    </Badge>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>
                  <td>{user.shift}</td>
                  <td>
                    <Badge
                      variant={
                        user.status === "active"
                          ? "success"
                          : user.status === "invited"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => requestDelete(user)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
          setFormError(null);
        }}
        title={editingUser ? "Edit User" : "Add User"}
      >
        <form onSubmit={requestSave} className="flex flex-col gap-4">
          <Input
            label="User ID"
            value={form.userCode}
            onChange={(e) => setForm((prev) => ({ ...prev, userCode: e.target.value.toUpperCase() }))}
            placeholder="Auto-generated if empty (e.g. USR-004)"
          />
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Short role summary shown below the name"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <div>
            <label className="input-label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as AdminRole }))}
            >
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          <Input
            label="Shift"
            value={form.shift}
            onChange={(e) => setForm((prev) => ({ ...prev, shift: e.target.value }))}
            placeholder="Morning, Lunch, Evening..."
          />
          <div>
            <label className="input-label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as UserFormState["status"],
                }))
              }
            >
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {formError && (
            <p style={{ color: "var(--danger)", fontSize: "13px" }}>{formError}</p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => {
                setFormOpen(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1">
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      <PinPadModal
        isOpen={pinModalOpen}
        onClose={closePinModal}
        title="Admin PIN Required"
        description={
          pendingAction === "delete"
            ? `Enter admin PIN to delete ${deleteTarget?.name || "this user"}.`
            : "Enter admin PIN to save user changes."
        }
        submitLabel={pendingAction === "delete" ? "Delete User" : "Confirm"}
        onSubmit={handlePinSubmit}
      />
    </div>
  );
}

