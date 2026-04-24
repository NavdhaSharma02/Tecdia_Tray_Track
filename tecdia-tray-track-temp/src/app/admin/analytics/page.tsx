"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import type { AdminStats, MenuItem, Transaction } from "@/types";

interface RankedDish {
  name: string;
  orders: number;
  revenue: number;
}

interface AnalyticsReportData {
  generatedAt: string;
  revenueToday: number;
  revenueMonth: number;
  avgMealCost: number;
  completedTransactionsToday: number;
  completedTransactionsMonth: number;
  averageOrderValueToday: number;
  averageOrderValueMonth: number;
  mostDemandedDish: RankedDish | null;
  secondMostDemandedDish: RankedDish | null;
  topCategory: { name: string; orders: number } | null;
  activeMenuCount: number;
  availableItemsCount: number;
  topItems: RankedDish[];
}

function isSameDay(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function isSameMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function buildAnalyticsReport(
  stats: AdminStats | null,
  menuItems: MenuItem[],
  transactions: Transaction[]
): AnalyticsReportData {
  const now = new Date();
  const completedTransactions = transactions.filter((txn) => txn.status === "completed");
  const todayTransactions = completedTransactions.filter((txn) =>
    isSameDay(new Date(txn.date), now)
  );
  const monthTransactions = completedTransactions.filter((txn) =>
    isSameMonth(new Date(txn.date), now)
  );

  const itemMap = new Map<string, RankedDish>();
  const categoryMap = new Map<string, number>();
  const menuCategoryByName = new Map(menuItems.map((item) => [item.name, item.category]));

  for (const txn of monthTransactions) {
    for (const item of txn.items) {
      const current = itemMap.get(item.name) || {
        name: item.name,
        orders: 0,
        revenue: 0,
      };
      current.orders += item.qty;
      current.revenue += item.qty * item.price;
      itemMap.set(item.name, current);

      const category = menuCategoryByName.get(item.name) || "Other";
      categoryMap.set(category, (categoryMap.get(category) || 0) + item.qty);
    }
  }

  const rankedItems = [...itemMap.values()].sort((a, b) => {
    if (b.orders !== a.orders) return b.orders - a.orders;
    return b.revenue - a.revenue;
  });

  const rankedCategories = [...categoryMap.entries()]
    .map(([name, orders]) => ({ name, orders }))
    .sort((a, b) => b.orders - a.orders);

  const revenueToday =
    stats?.revenueToday ??
    todayTransactions.reduce((sum, txn) => sum + txn.total, 0);
  const revenueMonth =
    stats?.monthlyRevenue ??
    monthTransactions.reduce((sum, txn) => sum + txn.total, 0);
  const avgMealCost =
    stats?.avgMealCost ??
    (monthTransactions.length
      ? monthTransactions.reduce((sum, txn) => sum + txn.total, 0) / monthTransactions.length
      : 0);

  return {
    generatedAt: now.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    revenueToday,
    revenueMonth,
    avgMealCost,
    completedTransactionsToday: todayTransactions.length,
    completedTransactionsMonth: monthTransactions.length,
    averageOrderValueToday: todayTransactions.length
      ? todayTransactions.reduce((sum, txn) => sum + txn.total, 0) / todayTransactions.length
      : 0,
    averageOrderValueMonth: monthTransactions.length
      ? monthTransactions.reduce((sum, txn) => sum + txn.total, 0) / monthTransactions.length
      : 0,
    mostDemandedDish: rankedItems[0] || null,
    secondMostDemandedDish: rankedItems[1] || null,
    topCategory: rankedCategories[0] || null,
    activeMenuCount: menuItems.length,
    availableItemsCount: menuItems.filter((item) => item.available).length,
    topItems: rankedItems.slice(0, 5),
  };
}

function buildReportText(report: AnalyticsReportData): string {
  const lines = [
    "TECDIA TRAY TRACK ANALYTICS REPORT",
    `Generated: ${report.generatedAt}`,
    "",
    "Executive Summary",
    `- Most in-demand dish: ${report.mostDemandedDish ? `${report.mostDemandedDish.name} (${report.mostDemandedDish.orders} orders)` : "No dish data available"}`,
    `- Second most in-demand dish: ${report.secondMostDemandedDish ? `${report.secondMostDemandedDish.name} (${report.secondMostDemandedDish.orders} orders)` : "No second dish available"}`,
    `- Top category this month: ${report.topCategory ? `${report.topCategory.name} (${report.topCategory.orders} orders)` : "No category data available"}`,
    `- Overall earnings today: ${formatCurrency(report.revenueToday)}`,
    `- Overall earnings this month: ${formatCurrency(report.revenueMonth)}`,
    `- Average meal cost: ${formatCurrency(report.avgMealCost)}`,
    `- Average order value today: ${formatCurrency(report.averageOrderValueToday)}`,
    `- Average order value this month: ${formatCurrency(report.averageOrderValueMonth)}`,
    "",
    "Operational Snapshot",
    `- Completed transactions today: ${report.completedTransactionsToday}`,
    `- Completed transactions this month: ${report.completedTransactionsMonth}`,
    `- Menu items scheduled today: ${report.activeMenuCount}`,
    `- Currently available items: ${report.availableItemsCount}`,
    "",
    "Top Dishes",
  ];

  if (!report.topItems.length) {
    lines.push("- No item demand data available yet.");
  } else {
    report.topItems.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.name} - ${item.orders} orders - ${formatCurrency(item.revenue)} revenue`
      );
    });
  }

  return lines.join("\n");
}

function escapeCsvValue(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildReportCsv(report: AnalyticsReportData): string {
  const rows: Array<Array<string | number>> = [
    ["Section", "Metric", "Value"],
    ["Summary", "Generated At", report.generatedAt],
    [
      "Summary",
      "Most In-Demand Dish",
      report.mostDemandedDish
        ? `${report.mostDemandedDish.name} (${report.mostDemandedDish.orders} orders)`
        : "No dish data available",
    ],
    [
      "Summary",
      "Second Most In-Demand Dish",
      report.secondMostDemandedDish
        ? `${report.secondMostDemandedDish.name} (${report.secondMostDemandedDish.orders} orders)`
        : "No second dish available",
    ],
    [
      "Summary",
      "Top Category This Month",
      report.topCategory
        ? `${report.topCategory.name} (${report.topCategory.orders} orders)`
        : "No category data available",
    ],
    ["Revenue", "Overall Earnings Today", report.revenueToday],
    ["Revenue", "Overall Earnings This Month", report.revenueMonth],
    ["Revenue", "Average Meal Cost", report.avgMealCost],
    ["Revenue", "Average Order Value Today", report.averageOrderValueToday],
    ["Revenue", "Average Order Value This Month", report.averageOrderValueMonth],
    ["Operations", "Completed Transactions Today", report.completedTransactionsToday],
    ["Operations", "Completed Transactions This Month", report.completedTransactionsMonth],
    ["Operations", "Menu Items Scheduled Today", report.activeMenuCount],
    ["Operations", "Currently Available Items", report.availableItemsCount],
  ];

  if (report.topItems.length) {
    report.topItems.forEach((item, index) => {
      rows.push([
        "Top Dishes",
        `${index + 1}. ${item.name}`,
        `${item.orders} orders | ${item.revenue} revenue`,
      ]);
    });
  } else {
    rows.push(["Top Dishes", "Ranking", "No item demand data available yet"]);
  }

  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    Promise.all([
      api.getAdminStats(),
      api.getMenuItems(),
      api.getAllTransactions(),
    ]).then(([statsRes, menuRes, transactionsRes]) => {
      if (statsRes.ok && statsRes.data) setStats(statsRes.data);
      if (menuRes.ok && menuRes.data) setMenuItems(menuRes.data);
      if (transactionsRes.ok && transactionsRes.data) setTransactions(transactionsRes.data);
    });
  }, []);

  const report = useMemo(
    () => buildAnalyticsReport(stats, menuItems, transactions),
    [stats, menuItems, transactions]
  );

  const reportText = useMemo(() => buildReportText(report), [report]);
  const reportCsv = useMemo(() => buildReportCsv(report), [report]);
  const topItems = report.topItems;
  const maxOrders = Math.max(...topItems.map((item) => item.orders), 1);

  function handleDownloadReport() {
    const blob = new Blob([reportCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `tecdia-analytics-report-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Analytics
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
          Cafeteria performance insights
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card variant="glass">
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Average Meal Cost
            </p>
            <p
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatCurrency(stats.avgMealCost)}
            </p>
          </Card>
          <Card variant="glass">
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Monthly Revenue
            </p>
            <p
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--success)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </Card>
          <Card variant="glass">
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Most Popular
            </p>
            <p
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--accent-light)",
              }}
            >
              {stats.popularItem}
            </p>
          </Card>
        </div>
      )}

      <Card variant="glass" className="mb-8">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              Download Report
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Export dish demand, overall earning for the day, monthly earning, and key usage trends.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={handleDownloadReport}>
            Download Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.56)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              Most In-Demand Dish
            </p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {report.mostDemandedDish?.name || "No demand data yet"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {report.mostDemandedDish
                ? `${report.mostDemandedDish.orders} orders this month`
                : "Waiting for completed transactions"}
            </p>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(255,255,255,0.56)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              Earnings Snapshot
            </p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {formatCurrency(report.revenueToday)} today
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {formatCurrency(report.revenueMonth)} for the month
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "18px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 251, 246, 0.72)",
            border: "1px solid var(--border)",
            fontSize: "14px",
            color: "var(--text-primary)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {reportText}
        </div>
      </Card>

      <Card variant="default" className="mb-8">
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "20px",
          }}
        >
          Top Items by Orders
        </h3>
        <div className="flex flex-col gap-4">
          {topItems.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {item.orders} orders
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "var(--bg-secondary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(item.orders / maxOrders) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                    borderRadius: "4px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          ))}
          {!topItems.length && (
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              No completed transaction data is available yet for the item ranking.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
