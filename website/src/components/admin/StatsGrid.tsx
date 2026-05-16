"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import type { AdminStats } from "@/types";

/**
 * Admin dashboard stats grid — text icons, no emojis.
 */
export default function StatsGrid() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.getAdminStats().then((res) => {
      if (res.ok && res.data) setStats(res.data);
    });
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="animate-shimmer"
            style={{ height: "140px", borderRadius: "var(--radius-lg)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard icon="M" label="Meals Served Today" value={stats.mealsToday} glowing />
      <StatCard icon="R" label="Revenue Today" value={formatCurrency(stats.revenueToday)} />
      <StatCard icon="U" label="Active Users" value={stats.activeUsers} />
      <StatCard icon="S" label="Most Popular Item" value={stats.popularItem} />
      <StatCard icon="A" label="Avg Meal Cost" value={formatCurrency(stats.avgMealCost)} />
      <StatCard icon="Mo" label="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} />
      <StatCard icon="Y" label="Yearly Revenue" value={formatCurrency(stats.yearlyRevenue)} />
    </div>
  );
}
