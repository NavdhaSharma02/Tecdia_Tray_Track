-- Indexes to speed admin analytics and transaction listing.

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_status_created_at
  ON transactions (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id
  ON transaction_items (transaction_id);
