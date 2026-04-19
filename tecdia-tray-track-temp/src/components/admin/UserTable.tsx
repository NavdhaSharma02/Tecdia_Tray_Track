"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { formatDateTime, getInitials } from "@/lib/utils";
import * as api from "@/services/api";
import type { AdminUser } from "@/types";

/**
 * Admin access management table for system users like admins and cashiers.
 */
export default function UserTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "admin" | "cashier">("all");

  useEffect(() => {
    api.getAdminUsers().then((res) => {
      if (res.ok && res.data) setUsers(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((user) => {
    const matchesRole = filter === "all" || user.role === filter;
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.shift.toLowerCase().includes(search.toLowerCase());

    return matchesRole && matchesSearch;
  });

  return (
    <div>
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
        <div className="flex items-center gap-2">
          {(["all", "admin", "cashier"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`btn ${filter === role ? "btn-primary" : "btn-outline"} btn-sm`}
            >
              {role === "all" ? "All Access" : role === "admin" ? "Admins" : "Cashiers"}
            </button>
          ))}
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
              <th>Handled Transactions</th>
              <th>Last Active</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8}>
                    <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
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
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                      {user.id}
                    </span>
                  </td>
                  <td>
                    <Badge variant={user.role === "admin" ? "danger" : "warning"}>
                      {user.role === "admin" ? "Admin Access" : "Cashier Access"}
                    </Badge>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>
                  <td>{user.shift}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {user.handledTransactions}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{formatDateTime(user.lastActiveAt)}</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
