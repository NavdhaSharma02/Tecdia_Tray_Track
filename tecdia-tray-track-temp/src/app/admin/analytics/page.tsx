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

interface DailyRevenuePoint {
  label: string;
  revenue: number;
}

interface AnalyticsReportData {
  generatedAt: string;
  revenueToday: number;
  revenueMonth: number;
  revenueYear: number;
  avgMealCost: number;
  completedTransactionsToday: number;
  completedTransactionsMonth: number;
  completedTransactionsYear: number;
  averageOrderValueToday: number;
  averageOrderValueMonth: number;
  averageOrderValueYear: number;
  mostDemandedDish: RankedDish | null;
  secondMostDemandedDish: RankedDish | null;
  topCategory: { name: string; orders: number } | null;
  activeMenuCount: number;
  availableItemsCount: number;
  topItems: RankedDish[];
  /** Completed checkouts this month by payment method (for export text). */
  paymentImmediateMonth: number;
  paymentAccountMonth: number;
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

function isSameYear(date: Date, reference: Date): boolean {
  return date.getFullYear() === reference.getFullYear();
}

function buildDailyRevenueTrend(transactions: Transaction[]): DailyRevenuePoint[] {
  const now = new Date();
  const points: DailyRevenuePoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);

    const revenue = transactions
      .filter((txn) => txn.status === "completed" && isSameDay(new Date(txn.date), date))
      .reduce((sum, txn) => sum + txn.total, 0);

    points.push({
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue,
    });
  }

  return points;
}

function buildMonthlyRevenueTrend(transactions: Transaction[]): DailyRevenuePoint[] {
  const now = new Date();
  const points: DailyRevenuePoint[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const revenue = transactions
      .filter((txn) => txn.status === "completed" && isSameMonth(new Date(txn.date), date))
      .reduce((sum, txn) => sum + txn.total, 0);

    points.push({
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      revenue,
    });
  }

  return points;
}

function buildYearlyRevenueTrend(transactions: Transaction[]): DailyRevenuePoint[] {
  const completed = transactions.filter((txn) => txn.status === "completed");
  if (!completed.length) {
    const y = new Date().getFullYear();
    return [{ label: String(y), revenue: 0 }];
  }

  const minYear = Math.min(...completed.map((txn) => new Date(txn.date).getFullYear()));
  const maxYear = new Date().getFullYear();
  const points: DailyRevenuePoint[] = [];

  for (let yr = minYear; yr <= maxYear; yr++) {
    const revenue = completed
      .filter((txn) => new Date(txn.date).getFullYear() === yr)
      .reduce((sum, txn) => sum + txn.total, 0);
    points.push({ label: String(yr), revenue });
  }

  return points;
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
  const yearTransactions = completedTransactions.filter((txn) =>
    isSameYear(new Date(txn.date), now)
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

  const paymentImmediateMonth = monthTransactions.filter(
    (txn) => txn.paymentMethod === "immediate"
  ).length;
  const paymentAccountMonth = monthTransactions.filter(
    (txn) => txn.paymentMethod === "account"
  ).length;

  const revenueToday =
    stats?.revenueToday ??
    todayTransactions.reduce((sum, txn) => sum + txn.total, 0);
  const revenueMonth =
    stats?.monthlyRevenue ??
    monthTransactions.reduce((sum, txn) => sum + txn.total, 0);
  const revenueYear =
    stats?.yearlyRevenue ??
    yearTransactions.reduce((sum, txn) => sum + txn.total, 0);
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
    revenueYear,
    avgMealCost,
    completedTransactionsToday: todayTransactions.length,
    completedTransactionsMonth: monthTransactions.length,
    completedTransactionsYear: yearTransactions.length,
    averageOrderValueToday: todayTransactions.length
      ? todayTransactions.reduce((sum, txn) => sum + txn.total, 0) / todayTransactions.length
      : 0,
    averageOrderValueMonth: monthTransactions.length
      ? monthTransactions.reduce((sum, txn) => sum + txn.total, 0) / monthTransactions.length
      : 0,
    averageOrderValueYear: yearTransactions.length
      ? yearTransactions.reduce((sum, txn) => sum + txn.total, 0) / yearTransactions.length
      : 0,
    mostDemandedDish: rankedItems[0] || null,
    secondMostDemandedDish: rankedItems[1] || null,
    topCategory: rankedCategories[0] || null,
    activeMenuCount: menuItems.length,
    availableItemsCount: menuItems.filter((item) => item.available).length,
    topItems: rankedItems.slice(0, 5),
    paymentImmediateMonth,
    paymentAccountMonth,
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
    `- Overall earnings this year: ${formatCurrency(report.revenueYear)}`,
    `- Average meal cost: ${formatCurrency(report.avgMealCost)}`,
    `- Average order value today: ${formatCurrency(report.averageOrderValueToday)}`,
    `- Average order value this month: ${formatCurrency(report.averageOrderValueMonth)}`,
    `- Average order value this year: ${formatCurrency(report.averageOrderValueYear)}`,
    "",
    "Payment mix (completed, this month)",
    `- Pay now: ${report.paymentImmediateMonth}`,
    `- Account: ${report.paymentAccountMonth}`,
    "",
    "Operational Snapshot",
    `- Completed transactions today: ${report.completedTransactionsToday}`,
    `- Completed transactions this month: ${report.completedTransactionsMonth}`,
    `- Completed transactions this year: ${report.completedTransactionsYear}`,
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
    ["Revenue", "Overall Earnings This Year", report.revenueYear],
    ["Revenue", "Average Meal Cost", report.avgMealCost],
    ["Revenue", "Average Order Value Today", report.averageOrderValueToday],
    ["Revenue", "Average Order Value This Month", report.averageOrderValueMonth],
    ["Revenue", "Average Order Value This Year", report.averageOrderValueYear],
    ["Payments", "Pay now (this month)", report.paymentImmediateMonth],
    ["Payments", "Account (this month)", report.paymentAccountMonth],
    ["Operations", "Completed Transactions Today", report.completedTransactionsToday],
    ["Operations", "Completed Transactions This Month", report.completedTransactionsMonth],
    ["Operations", "Completed Transactions This Year", report.completedTransactionsYear],
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
  const [dishPieFilter, setDishPieFilter] = useState<"quantity" | "revenue">("revenue");
  const [globalTimeFilter, setGlobalTimeFilter] = useState<"day" | "month" | "year">("month");
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
  const revenueTrend = useMemo(() => {
    if (globalTimeFilter === "month") return buildMonthlyRevenueTrend(transactions);
    if (globalTimeFilter === "year") return buildYearlyRevenueTrend(transactions);
    return buildDailyRevenueTrend(transactions);
  }, [transactions, globalTimeFilter]);

  // Dish bar chart data
  const dishPieData = useMemo(() => {
    const now = new Date();
    const completed = transactions.filter((txn) => {
      if (txn.status !== "completed") return false;
      const d = new Date(txn.date);
      if (globalTimeFilter === "day") return isSameDay(d, now);
      if (globalTimeFilter === "year") return d.getFullYear() === now.getFullYear();
      return isSameMonth(d, now);
    });
    const dishMap = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const txn of completed) {
      for (const item of txn.items) {
        const cur = dishMap.get(item.name) || { name: item.name, orders: 0, revenue: 0 };
        cur.orders += item.qty;
        cur.revenue += item.qty * item.price;
        dishMap.set(item.name, cur);
      }
    }
    const all = [...dishMap.values()];
    const sorted = all
      .sort((a, b) =>
        dishPieFilter === "revenue" ? b.revenue - a.revenue : b.orders - a.orders
      )
      .slice(0, 8);
    const total = sorted.reduce(
      (sum, d) => sum + (dishPieFilter === "revenue" ? d.revenue : d.orders),
      0
    );
    return { slices: sorted, total };
  }, [transactions, dishPieFilter, globalTimeFilter]);

  const PIE_COLORS = [
    "#C66E5B", // accent
    "#E7A964", // accent-light
    "#5CA365", // success
    "#6B8FD4", // blue
    "#B87CC4", // purple
    "#D4A84B", // gold
    "#5BBDB5", // teal
    "#D46B6B", // rose
  ];

  function buildPieGradient(): string {
    if (!dishPieData.slices.length) return "#e5e5e5";
    const total = dishPieData.total || 1;
    let cumulative = 0;
    const stops: string[] = [];
    dishPieData.slices.forEach((slice, i) => {
      const value = dishPieFilter === "revenue" ? slice.revenue : slice.orders;
      const pct = (value / total) * 100;
      const start = cumulative;
      const end = cumulative + pct;
      stops.push(`${PIE_COLORS[i % PIE_COLORS.length]} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
      cumulative = end;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }
  const paymentMethodSplit = useMemo(() => {
    const now = new Date();
    const completed = transactions.filter((txn) => {
      if (txn.status !== "completed") return false;
      const d = new Date(txn.date);
      if (globalTimeFilter === "day") return isSameDay(d, now);
      if (globalTimeFilter === "year") return isSameYear(d, now);
      return isSameMonth(d, now);
    });
    const immediate = completed.filter((txn) => txn.paymentMethod === "immediate").length;
    const account = completed.filter((txn) => txn.paymentMethod === "account").length;
    const completedCount = immediate + account;
    const denom = Math.max(completedCount, 1);

    return {
      immediate,
      account,
      completedCount,
      immediatePct: (immediate / denom) * 100,
      accountPct: (account / denom) * 100,
    };
  }, [transactions, globalTimeFilter]);
  const topEmployeeSpenders = useMemo(() => {
    const now = new Date();
    const spendByEmployee = new Map<string, number>();

    for (const txn of transactions.filter((txn) => {
      if (txn.status !== "completed") return false;
      const d = new Date(txn.date);
      if (globalTimeFilter === "day") return isSameDay(d, now);
      if (globalTimeFilter === "year") return d.getFullYear() === now.getFullYear();
      return isSameMonth(d, now);
    })) {
      spendByEmployee.set(txn.employeeId, (spendByEmployee.get(txn.employeeId) || 0) + txn.total);
    }

    return [...spendByEmployee.entries()]
      .map(([employeeId, total]) => ({ employeeId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions, globalTimeFilter]);
  const overviewStats = [
    {
      label: "Revenue Today",
      value: formatCurrency(report.revenueToday),
      note: `${report.completedTransactionsToday} completed transactions`,
      accent: "var(--success)",
      glow: "rgba(92, 163, 101, 0.18)",
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(report.revenueMonth),
      note: `${report.completedTransactionsMonth} completed transactions`,
      accent: "var(--accent)",
      glow: "rgba(198, 110, 91, 0.18)",
    },
    {
      label: "Revenue This Year",
      value: formatCurrency(report.revenueYear),
      note: `${report.completedTransactionsYear} completed transactions`,
      accent: "#6B8FD4",
      glow: "rgba(107, 143, 212, 0.18)",
    },
    {
      label: "Average Meal Cost",
      value: formatCurrency(report.avgMealCost),
      note: `${formatCurrency(report.averageOrderValueMonth)} average order value (month)`,
      accent: "var(--accent-light)",
      glow: "rgba(231, 169, 100, 0.2)",
    },
    {
      label: "Most In-Demand Dish",
      value: report.mostDemandedDish?.name || "No demand data yet",
      note: report.mostDemandedDish
        ? `${report.mostDemandedDish.orders} orders this month`
        : "Waiting for completed transactions",
      accent: "var(--text-primary)",
      glow: "rgba(255, 255, 255, 0.22)",
    },
  ];

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
      <div className="mb-8" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
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

        {/* Global Time Filter */}
        <div
          style={{
            display: "inline-flex",
            borderRadius: "24px",
            overflow: "hidden",
            border: "1.5px solid var(--border)",
            background: "rgba(255,255,255,0.6)",
            boxShadow: "var(--shadow-sm)",
            alignSelf: "center",
          }}
        >
          {(["day", "month", "year"] as const).map((opt) => (
            <button
              key={opt}
              id={`global-time-filter-${opt}`}
              onClick={() => setGlobalTimeFilter(opt)}
              style={{
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: globalTimeFilter === opt
                  ? "linear-gradient(135deg, var(--accent), var(--accent-light))"
                  : "transparent",
                color: globalTimeFilter === opt ? "#fff" : "var(--text-secondary)",
              }}
            >
              {opt === "day" ? "Today" : opt === "month" ? "This Month" : "This Year"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mb-8"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {overviewStats.map((item) => (
          <div
            key={item.label}
            className="animate-scale-pop"
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "28px",
              padding: "22px 22px 20px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,248,241,0.72) 100%)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              minHeight: "148px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backdropFilter: "blur(14px)",
            }}
          >

            <div>
              <p
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "12px",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  fontSize: item.label === "Most In-Demand Dish" ? "24px" : "30px",
                  lineHeight: 1.05,
                  fontWeight: 800,
                  color: item.accent,
                  fontFamily:
                    item.label === "Most In-Demand Dish" ? "var(--font-display)" : "var(--font-mono)",
                  maxWidth: "14ch",
                }}
              >
                {item.value}
              </p>
            </div>

            <div
              style={{
                marginTop: "18px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(154, 90, 78, 0.12)",
              }}
            >
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                {item.note}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <Card variant="glass">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                Payment mix
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                Completed checkouts by method for{" "}
                {globalTimeFilter === "day"
                  ? "today"
                  : globalTimeFilter === "month"
                    ? "this month"
                    : "this calendar year"}
              </p>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {paymentMethodSplit.completedCount} total
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                  Pay now
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  {paymentMethodSplit.immediate} ({paymentMethodSplit.immediatePct.toFixed(0)}%)
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
                    width: `${paymentMethodSplit.immediatePct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                  Charge to account
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  {paymentMethodSplit.account} ({paymentMethodSplit.accountPct.toFixed(0)}%)
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
                    width: `${paymentMethodSplit.accountPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--success), var(--accent-light))",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>


      <div className="mb-8">
        <Card variant="glass">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                Revenue Trend
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                {globalTimeFilter === "day"
                  ? "Completed transaction revenue over the last 7 days"
                  : globalTimeFilter === "month"
                    ? "Completed transaction revenue over the last 12 months"
                    : "Completed transaction revenue by year"}
              </p>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              Peak: {formatCurrency(Math.max(...revenueTrend.map((point) => point.revenue), 0))}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${revenueTrend.length}, minmax(0, 1fr))`,
              alignItems: "end",
              gap: "12px",
              minHeight: "240px",
            }}
          >
            {revenueTrend.map((point) => {
              const maxRevenue = Math.max(...revenueTrend.map((entry) => entry.revenue), 1);
              const height = Math.max((point.revenue / maxRevenue) * 180, point.revenue > 0 ? 18 : 8);

              return (
                <div
                  key={point.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "10px",
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {formatCurrency(point.revenue)}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "56px",
                      height: `${height}px`,
                      borderRadius: "18px 18px 8px 8px",
                      background: "linear-gradient(180deg, var(--accent-light), var(--accent))",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>


      {/* Revenue by Dish Pie Chart */}
      <Card variant="glass" className="mb-8">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              Sales Breakdown by Dish
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
              Top dishes {globalTimeFilter === "day" ? "today" : globalTimeFilter === "month" ? "this month" : "this year"} — toggle to compare by quantity or revenue
            </p>
          </div>

          {/* Revenue/Quantity Filter Toggle */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1.5px solid var(--border)",
              background: "rgba(255,255,255,0.5)",
            }}
          >
            {(["revenue", "quantity"] as const).map((opt) => (
              <button
                key={opt}
                id={`dish-pie-filter-${opt}`}
                onClick={() => setDishPieFilter(opt)}
                style={{
                  padding: "7px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background:
                    dishPieFilter === opt
                      ? "linear-gradient(135deg, var(--accent), var(--accent-light))"
                      : "transparent",
                  color: dishPieFilter === opt ? "#fff" : "var(--text-secondary)",
                  letterSpacing: "0.04em",
                }}
              >
                {opt === "revenue" ? "By Revenue" : "By Quantity"}
              </button>
            ))}
          </div>
        </div>

        {dishPieData.slices.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
            No completed transaction data available yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {dishPieData.slices.map((slice) => {
              const value = dishPieFilter === "revenue" ? slice.revenue : slice.orders;
              const maxValue = Math.max(
                ...dishPieData.slices.map((s) =>
                  dishPieFilter === "revenue" ? s.revenue : s.orders
                ),
                1
              );
              return (
                <div key={slice.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {slice.name}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      {dishPieFilter === "revenue" ? formatCurrency(value) : `${value} qty`}
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
                        width: `${(value / maxValue) * 100}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                        borderRadius: "4px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card variant="glass">
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "20px",
          }}
        >
          Top Employee Spend
        </h3>
        <div className="flex flex-col gap-4">
          {topEmployeeSpenders.map((employee) => {
            const maxTotal = Math.max(...topEmployeeSpenders.map((entry) => entry.total), 1);
            return (
              <div key={employee.employeeId}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {employee.employeeId}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {formatCurrency(employee.total)}
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
                      width: `${(employee.total / maxTotal) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, var(--success), var(--accent-light))",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {!topEmployeeSpenders.length && (
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              No completed transaction data is available yet for employee spend charts.
            </p>
          )}
        </div>
      </Card>

      <Card variant="glass" className="mt-8">
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
              {formatCurrency(report.revenueMonth)} for the month · {formatCurrency(report.revenueYear)} year to date
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
    </div>
  );
}
