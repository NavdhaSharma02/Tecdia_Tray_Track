"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils";
import * as api from "@/services/api";
import type { Employee } from "@/types";

export default function EmployeeManagementTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "on_leave" | "inactive">("all");

  useEffect(() => {
    api.getAllEmployees().then((res) => {
      if (res.ok && res.data) setEmployees(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = employees.filter((emp) => {
    const matchesFilter = filter === "all" || emp.status === filter;
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.id.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
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
          placeholder="Search by employee, ID, email, or department..."
          className="input"
          style={{ maxWidth: "420px" }}
        />
        <div className="flex items-center gap-2">
          {(["all", "active", "on_leave", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn ${filter === status ? "btn-primary" : "btn-outline"} btn-sm`}
            >
              {status === "all" ? "All Employees" : status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Balance</th>
              <th>Transactions</th>
              <th>Total Spent</th>
              <th>Primary Payment</th>
              <th>Last Transaction</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}>
                    <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
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
                      <div>
                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{emp.id}</td>
                  <td><Badge variant="accent">{emp.department}</Badge></td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatCurrency(emp.accountBalance)}</td>
                  <td>{emp.totalTransactions ?? 0}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatCurrency(emp.totalSpent ?? 0)}</td>
                  <td>
                    <Badge variant={emp.primaryPaymentMethod === "account" ? "warning" : "success"}>
                      {emp.primaryPaymentMethod === "account"
                        ? "Account"
                        : emp.primaryPaymentMethod === "immediate"
                          ? "Immediate"
                          : "N/A"}
                    </Badge>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {emp.lastTransactionAt ? formatDateTime(emp.lastTransactionAt) : "No transactions yet"}
                  </td>
                  <td>
                    <Badge
                      variant={
                        emp.status === "active"
                          ? "success"
                          : emp.status === "on_leave"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {emp.status?.replace("_", " ") || "active"}
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
