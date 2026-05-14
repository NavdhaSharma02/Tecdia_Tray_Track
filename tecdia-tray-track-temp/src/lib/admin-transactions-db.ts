import { getDbPool } from "@/lib/db";
import type { PaymentMethod, Transaction } from "@/types";

interface TransactionRow {
  id: string;
  employee_code: string;
  created_at: Date;
  total_amount: string;
  payment_method: PaymentMethod;
  payment_status: string;
}

interface TransactionItemRow {
  transaction_id: string;
  item_name_snapshot: string;
  quantity: number;
  unit_price: string;
}

export async function listTransactionsForAdmin(): Promise<Transaction[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<TransactionRow>(
    `
    SELECT
      t.id::text,
      c.employee_code,
      t.created_at,
      t.total_amount::text,
      t.payment_method,
      t.payment_status
    FROM transactions t
    JOIN customers c ON c.id = t.customer_id
    ORDER BY t.created_at DESC
    LIMIT 5000;
    `
  );

  if (!rows.length) return [];

  const ids = rows.map((r) => r.id);
  const { rows: itemRows } = await pool.query<TransactionItemRow>(
    `
    SELECT
      ti.transaction_id::text,
      ti.item_name_snapshot,
      ti.quantity,
      ti.unit_price::text
    FROM transaction_items ti
    WHERE ti.transaction_id = ANY($1::uuid[])
    ORDER BY ti.transaction_id;
    `,
    [ids]
  );

  const byTx = new Map<string, TransactionItemRow[]>();
  for (const item of itemRows) {
    const list = byTx.get(item.transaction_id) || [];
    list.push(item);
    byTx.set(item.transaction_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employee_code,
    date: row.created_at.toISOString(),
    items: (byTx.get(row.id) || []).map((item) => ({
      name: item.item_name_snapshot,
      qty: item.quantity,
      price: Number(item.unit_price),
    })),
    total: Number(row.total_amount),
    paymentMethod: row.payment_method,
    status: (row.payment_status || "completed") as Transaction["status"],
  }));
}
