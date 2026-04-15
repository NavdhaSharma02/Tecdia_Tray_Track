"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import * as api from "@/services/api";
import type { AdminStats, MenuItem } from "@/types";

/**
 * Admin Analytics page — no emojis, text labels only.
 */
export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    api.getAdminStats().then((res) => {
      if (res.ok && res.data) setStats(res.data);
    });
    api.getMenuItems().then((res) => {
      if (res.ok && res.data) setMenuItems(res.data);
    });
  }, []);

  const topItems = menuItems
    .filter((i) => i.available)
    .slice(0, 6)
    .map((item) => ({
      ...item,
      orders: Math.floor(Math.random() * 40) + 10,
    }))
    .sort((a, b) => b.orders - a.orders);

  const maxOrders = Math.max(...topItems.map((i) => i.orders), 1);

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

      {/* Top items bar chart */}
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
            <div key={item.id}>
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
        </div>
      </Card>
    </div>
  );
}
