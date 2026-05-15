import { getDbPool } from "@/lib/db";
import type { PaymentMethod, ScannedItem } from "@/types";

export interface CustomerTransactionSummary {
  id: string;
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  status: string;
}

export interface FeedbackRow {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  transactionId: string | null;
  issueText: string;
  createdAt: string;
}

function formatPaymentStatus(status: string): string {
  return status || "completed";
}

/** Sum of completed "add to account" charges for this customer. */
export async function getCustomerAccountBalance(
  customerId: string
): Promise<number> {
  const pool = getDbPool();
  const { rows } = await pool.query<{ total: string }>(
    `
    SELECT COALESCE(SUM(total_amount), 0)::text AS total
    FROM transactions
    WHERE customer_id = $1::uuid
      AND payment_method = 'account'
      AND payment_status = 'completed';
    `,
    [customerId]
  );
  return Number(rows[0]?.total || 0);
}

export async function createCheckoutTransaction(input: {
  customerId: string;
  items: ScannedItem[];
  paymentMethod: PaymentMethod;
}): Promise<CustomerTransactionSummary> {
  const pool = getDbPool();
  const subtotal = input.items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  const total = subtotal;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{
      id: string;
      total_amount: string;
      payment_method: string;
      created_at: Date;
      payment_status: string;
    }>(
      `
      INSERT INTO transactions (
        customer_id,
        subtotal,
        tax_amount,
        total_amount,
        payment_method,
        payment_status
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6)
      RETURNING id::text, total_amount, payment_method, created_at, payment_status;
      `,
      [input.customerId, subtotal, 0, total, input.paymentMethod, "completed"]
    );

    const transaction = inserted.rows[0];
    for (const item of input.items) {
      await client.query(
        `
        INSERT INTO transaction_items (
          transaction_id,
          menu_item_id,
          item_name_snapshot,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1::uuid, NULL, $2, $3, $4, $5);
        `,
        [
          transaction.id,
          item.name,
          item.quantity,
          item.price,
          item.price * item.quantity,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      id: transaction.id,
      total: Number(transaction.total_amount),
      paymentMethod: transaction.payment_method as PaymentMethod,
      date: transaction.created_at.toISOString(),
      status: formatPaymentStatus(transaction.payment_status),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listCustomerTransactions(
  customerId: string
): Promise<CustomerTransactionSummary[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<{
    id: string;
    total_amount: string;
    payment_method: string;
    created_at: Date;
    payment_status: string;
  }>(
    `
    SELECT id::text, total_amount, payment_method, created_at, payment_status
    FROM transactions
    WHERE customer_id = $1::uuid
    ORDER BY created_at DESC
    LIMIT 100;
    `,
    [customerId]
  );

  return rows.map((row) => ({
    id: row.id,
    total: Number(row.total_amount),
    paymentMethod: row.payment_method as PaymentMethod,
    date: row.created_at.toISOString(),
    status: formatPaymentStatus(row.payment_status),
  }));
}

export async function createFeedback(input: {
  customerId: string;
  issueText: string;
  transactionId?: string | null;
}): Promise<void> {
  const pool = getDbPool();
  const transactionId = input.transactionId || null;

  if (transactionId) {
    const ownership = await pool.query(
      `
      SELECT 1
      FROM transactions
      WHERE id = $1::uuid
        AND customer_id = $2::uuid
      LIMIT 1;
      `,
      [transactionId, input.customerId]
    );
    if (!ownership.rowCount) {
      throw new Error("Selected transaction does not belong to this customer.");
    }
  }

  await pool.query(
    `
    INSERT INTO feedbacks (customer_id, transaction_id, issue_text)
    VALUES ($1::uuid, $2::uuid, $3);
    `,
    [input.customerId, transactionId, input.issueText]
  );
}

export async function listAllFeedbacks(): Promise<FeedbackRow[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<{
    id: string;
    customer_id: string;
    customer_email: string;
    customer_name: string;
    transaction_id: string | null;
    issue_text: string;
    created_at: Date;
  }>(
    `
    SELECT
      f.id::text,
      f.customer_id::text,
      c.email AS customer_email,
      c.full_name AS customer_name,
      f.transaction_id::text,
      f.issue_text,
      f.created_at
    FROM feedbacks f
    JOIN customers c ON c.id = f.customer_id
    ORDER BY f.created_at DESC;
    `
  );

  return rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    transactionId: row.transaction_id,
    issueText: row.issue_text,
    createdAt: row.created_at.toISOString(),
  }));
}
