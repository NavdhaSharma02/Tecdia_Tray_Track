"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, getInitials } from "@/lib/utils";
import * as api from "@/services/api";
import type { Employee } from "@/types";

/**
 * Admin user management table.
 */
export default function UserTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllEmployees().then((res) => {
      if (res.ok && res.data) setEmployees(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or department..."
          className="input"
          style={{ maxWidth: "400px" }}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Email</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}>
                    <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id}>
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
                        {getInitials(emp.name)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{emp.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                      {emp.id}
                    </span>
                  </td>
                  <td>
                    <Badge variant="accent">{emp.department}</Badge>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{emp.email}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: emp.accountBalance > 0 ? "var(--success)" : "var(--text-muted)",
                      }}
                    >
                      {formatCurrency(emp.accountBalance)}
                    </span>
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
