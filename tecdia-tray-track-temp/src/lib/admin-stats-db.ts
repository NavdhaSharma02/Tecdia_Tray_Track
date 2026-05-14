import { getDbPool } from "@/lib/db";
import type { AdminStats } from "@/types";

export async function getAdminDashboardStats(): Promise<AdminStats> {
  const pool = getDbPool();

  const { rows } = await pool.query<{
    meals_today: string;
    revenue_today: string;
    monthly_revenue: string;
    yearly_revenue: string;
    month_meal_units: string;
    month_txn_count: string;
    active_users_month: string;
    popular_item: string | null;
  }>(
    `
    SELECT
      (
        SELECT COALESCE(SUM(ti.quantity), 0)
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('day', t.created_at) = date_trunc('day', now())
      )::text AS meals_today,
      (
        SELECT COALESCE(SUM(t.total_amount), 0)
        FROM transactions t
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('day', t.created_at) = date_trunc('day', now())
      )::text AS revenue_today,
      (
        SELECT COALESCE(SUM(t.total_amount), 0)
        FROM transactions t
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('month', t.created_at) = date_trunc('month', now())
      )::text AS monthly_revenue,
      (
        SELECT COALESCE(SUM(t.total_amount), 0)
        FROM transactions t
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('year', t.created_at) = date_trunc('year', now())
      )::text AS yearly_revenue,
      (
        SELECT COALESCE(SUM(ti.quantity), 0)
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('month', t.created_at) = date_trunc('month', now())
      )::text AS month_meal_units,
      (
        SELECT COUNT(*)::bigint
        FROM transactions t
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('month', t.created_at) = date_trunc('month', now())
      )::text AS month_txn_count,
      (
        SELECT COUNT(DISTINCT t.customer_id)::bigint
        FROM transactions t
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('month', t.created_at) = date_trunc('month', now())
      )::text AS active_users_month,
      (
        SELECT ti.item_name_snapshot
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        WHERE LOWER(t.payment_status) = 'completed'
          AND date_trunc('month', t.created_at) = date_trunc('month', now())
        GROUP BY ti.item_name_snapshot
        ORDER BY SUM(ti.quantity) DESC, SUM(ti.line_total) DESC
        LIMIT 1
      ) AS popular_item;
    `
  );

  const r = rows[0];
  const mealsToday = Number(r?.meals_today ?? 0);
  const revenueToday = Number(r?.revenue_today ?? 0);
  const monthlyRevenue = Number(r?.monthly_revenue ?? 0);
  const yearlyRevenue = Number(r?.yearly_revenue ?? 0);
  const monthMealUnits = Number(r?.month_meal_units ?? 0);
  const monthTxnCount = Number(r?.month_txn_count ?? 0);

  const avgMealCost =
    monthMealUnits > 0
      ? monthlyRevenue / monthMealUnits
      : monthTxnCount > 0
        ? monthlyRevenue / monthTxnCount
        : 0;

  return {
    mealsToday,
    revenueToday,
    activeUsers: Number(r?.active_users_month ?? 0),
    popularItem: r?.popular_item?.trim() ? r.popular_item : "No sales yet",
    avgMealCost: Number.isFinite(avgMealCost) ? avgMealCost : 0,
    monthlyRevenue,
    yearlyRevenue,
  };
}
