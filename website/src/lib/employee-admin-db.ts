import { getDbPool } from "@/lib/db";
import type { Employee, PaymentMethod } from "@/types";

interface EmployeeAggRow {
  employee_code: string;
  full_name: string;
  email: string;
  department: string;
  created_at: Date;
  account_balance: string;
  total_transactions: string;
  total_spent: string;
  last_transaction_at: Date | null;
  primary_payment_method: PaymentMethod | null;
}

export async function listEmployeesForAdmin(): Promise<Employee[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<EmployeeAggRow>(
    `
    SELECT
      c.employee_code,
      c.full_name,
      c.email,
      c.department,
      c.created_at,
      COALESCE((
        SELECT SUM(t3.total_amount)
        FROM transactions t3
        WHERE t3.customer_id = c.id
          AND t3.payment_method = 'account'
          AND t3.payment_status = 'completed'
      ), 0)::text AS account_balance,
      COUNT(t.id)::text AS total_transactions,
      COALESCE(SUM(t.total_amount), 0)::text AS total_spent,
      MAX(t.created_at) AS last_transaction_at,
      (
        SELECT t2.payment_method
        FROM transactions t2
        WHERE t2.customer_id = c.id
        ORDER BY t2.created_at DESC
        LIMIT 1
      ) AS primary_payment_method
    FROM customers c
    LEFT JOIN transactions t ON t.customer_id = c.id
    WHERE c.is_active = TRUE
    GROUP BY c.id, c.employee_code, c.full_name, c.email, c.department, c.created_at
    ORDER BY c.created_at DESC;
    `
  );

  return rows.map((row) => ({
    id: row.employee_code,
    name: row.full_name,
    department: row.department,
    email: row.email,
    avatar: null,
    accountBalance: Number(row.account_balance || 0),
    joinDate: row.created_at.toISOString(),
    status: "active",
    totalTransactions: Number(row.total_transactions || 0),
    totalSpent: Number(row.total_spent || 0),
    lastTransactionAt: row.last_transaction_at
      ? row.last_transaction_at.toISOString()
      : null,
    primaryPaymentMethod: row.primary_payment_method,
  }));
}

export async function updateEmployeeProfileByCode(input: {
  currentEmployeeCode: string;
  nextEmployeeCode: string;
  fullName: string;
  department: string;
}): Promise<boolean> {
  const pool = getDbPool();
  const result = await pool.query(
    `
    UPDATE customers
    SET employee_code = $2,
        full_name = $3,
        department = $4,
        updated_at = NOW()
    WHERE employee_code = $1
    RETURNING id;
    `,
    [
      input.currentEmployeeCode.trim().toUpperCase(),
      input.nextEmployeeCode.trim().toUpperCase(),
      input.fullName.trim(),
      input.department.trim(),
    ]
  );
  return Boolean(result.rowCount);
}

export async function removeEmployeeByCode(employeeCode: string): Promise<boolean> {
  const pool = getDbPool();
  const result = await pool.query(
    `
    UPDATE customers
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE employee_code = $1
      AND is_active = TRUE
    RETURNING id;
    `,
    [employeeCode.trim().toUpperCase()]
  );
  return (result.rowCount ?? 0) > 0;
}
