"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils";
import * as api from "@/services/api";
import type { Employee } from "@/types";

export default function EmployeeManagementTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "on_leave" | "inactive">("all");
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editEmployeeCode, setEditEmployeeCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const openEdit = (employee: Employee) => {
    setEditEmployee(employee);
    setEditEmployeeCode(employee.id);
    setEditName(employee.name);
    setEditDepartment(employee.department);
    setEditError(null);
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editEmployee) return;
    if (!editEmployeeCode.trim() || !editName.trim() || !editDepartment.trim()) {
      setEditError("Employee ID, full name, and department are required.");
      return;
    }
    setIsSaving(true);
    setEditError(null);
    const result = await api.updateEmployeeProfile(editEmployee.id, {
      employeeCode: editEmployeeCode.trim().toUpperCase(),
      fullName: editName.trim(),
      department: editDepartment.trim(),
    });
    setIsSaving(false);
    if (!result.ok) {
      setEditError(result.error || "Could not update employee.");
      return;
    }
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === editEmployee.id
          ? {
              ...emp,
              id: editEmployeeCode.trim().toUpperCase(),
              name: editName.trim(),
              department: editDepartment.trim(),
            }
          : emp
      )
    );
    setEditEmployee(null);
  };

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10}>
                    <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
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
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "13px" }}
                      onClick={() => openEdit(emp)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        title="Edit Employee"
      >
        <form onSubmit={saveEdit} style={{ display: "grid", gap: "12px" }}>
          <Input
            label="Employee ID"
            value={editEmployeeCode}
            onChange={(event) => setEditEmployeeCode(event.target.value)}
            placeholder="Employee ID"
          />
          <Input
            label="Full Name"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            placeholder="Full name"
          />
          <Input
            label="Department"
            value={editDepartment}
            onChange={(event) => setEditDepartment(event.target.value)}
            placeholder="Department"
          />
          {editError && (
            <p style={{ fontSize: "13px", color: "var(--danger)", fontWeight: 700 }}>
              {editError}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => setEditEmployee(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1" isLoading={isSaving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
