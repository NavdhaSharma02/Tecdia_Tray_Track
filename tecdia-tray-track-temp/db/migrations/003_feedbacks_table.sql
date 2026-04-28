-- Customer feedbacks, optionally linked to a completed transaction.

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  issue_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_customer_id ON feedbacks(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_transaction_id ON feedbacks(transaction_id);
