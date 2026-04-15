"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import * as api from "@/services/api";
import type { Transaction } from "@/types";

/**
 * Admin transaction history table with filters.
 */
export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "immediate" | "account">("all");

  useEffect(() => {
    api.getAllTransactions().then((res) => {
      if (res.ok && res.data) setTransactions(res.data);
      setLoading(false);
    });
  }, []);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.paymentMethod === filter);

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(["all", "immediate", "account"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? "btn-primary" : "btn-outline"} btn-sm`}
          >
            {f === "all" ? "All" : f === "immediate" ? "Paid" : "Account"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Employee</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7}>
                    <div className="animate-shimmer" style={{ height: "20px", borderRadius: "4px" }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  No transactions found
                </td>
              </tr>
            ) : (
              filtered.map((txn) => (
                <tr key={txn.id}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent-light)" }}>
                      {txn.id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                      {txn.employeeId}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {formatDateTime(txn.date)}
                  </td>
                  <td style={{ color: "var(--text-secondary)", maxWidth: "200px" }}>
                    {txn.items.map((i) => `${i.name}×${i.qty}`).join(", ")}
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {formatCurrency(txn.total)}
                    </span>
                  </td>
                  <td>
                    <Badge variant={txn.paymentMethod === "account" ? "warning" : "success"}>
                      {txn.paymentMethod === "account" ? "Account" : "Paid"}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant="success">{txn.status}</Badge>
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
