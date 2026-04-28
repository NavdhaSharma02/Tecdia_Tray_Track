import { getDbPool } from "@/lib/db";
import type { Employee, PaymentMethod } from "@/types";

interface EmployeeAggRow {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  department: string;
  created_at: Date;
  total_transactions: string;
  total_spent: string;
  last_transaction_at: Date | null;
  primary_payment_method: PaymentMethod | null;
}

function rowToEmployee(row: EmployeeAggRow): Employee {
  return {
    id: row.employee_code,
    name: row.full_name,
    department: row.department,
    email: row.email,
    avatar: null,
    accountBalance: 0,
    joinDate: row.created_at.toISOString(),
    status: "active",
    totalTransactions: Number(row.total_transactions || 0),
    totalSpent: Number(row.total_spent || 0),
    lastTransactionAt: row.last_transaction_at
      ? row.last_transaction_at.toISOString()
      : null,
    primaryPaymentMethod: row.primary_payment_method,
  };
}

export async function listEmployeesForAdmin(): Promise<Employee[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<EmployeeAggRow>(
    `
    SELECT
      c.id::text AS id,
      c.employee_code,
      c.full_name,
      c.email,
      c.department,
      c.created_at,
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
    GROUP BY c.id, c.employee_code, c.full_name, c.email, c.department, c.created_at
    ORDER BY c.created_at DESC;
    `
  );
  return rows.map(rowToEmployee);
}

export async function updateEmployeeProfileByEmployeeCode(input: {
  currentEmployeeCode: string;
  nextEmployeeCode: string;
  fullName: string;
  department: string;
}): Promise<Employee | null> {
  const pool = getDbPool();
  const result = await pool.query<{
    id: string;
    employee_code: string;
    full_name: string;
    email: string;
    department: string;
    created_at: Date;
  }>(
    `
    UPDATE customers
    SET employee_code = $2,
        full_name = $3,
        department = $4,
        updated_at = NOW()
    WHERE employee_code = $1
    RETURNING id::text, employee_code, full_name, email, department, created_at;
    `,
    [
      input.currentEmployeeCode.trim().toUpperCase(),
      input.nextEmployeeCode.trim().toUpperCase(),
      input.fullName.trim(),
      input.department.trim(),
    ]
  );

  if (!result.rows.length) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.employee_code,
    name: row.full_name,
    department: row.department,
    email: row.email,
    avatar: null,
    accountBalance: 0,
    joinDate: row.created_at.toISOString(),
    status: "active",
    totalTransactions: 0,
    totalSpent: 0,
    lastTransactionAt: null,
    primaryPaymentMethod: null,
  };
}
