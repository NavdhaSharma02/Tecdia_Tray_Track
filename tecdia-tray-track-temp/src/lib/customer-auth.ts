import { getDbPool } from "@/lib/db";

export interface AuthCustomer {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

interface CustomerRow {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  password_salt: string;
  created_at: Date;
}

export async function createCustomer(input: {
  email: string;
  fullName: string;
  passwordHash: string;
  passwordSalt: string;
}): Promise<AuthCustomer> {
  const pool = getDbPool();
  const query = `
    INSERT INTO customers (email, full_name, password_hash, password_salt)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, created_at;
  `;

  const { rows } = await pool.query<{
    id: string;
    email: string;
    full_name: string;
    created_at: Date;
  }>(query, [input.email, input.fullName, input.passwordHash, input.passwordSalt]);

  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findCustomerByEmail(
  email: string
): Promise<(AuthCustomer & { passwordHash: string; passwordSalt: string }) | null> {
  const pool = getDbPool();
  const query = `
    SELECT id, email, full_name, password_hash, password_salt, created_at
    FROM customers
    WHERE email = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query<CustomerRow>(query, [email]);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findCustomerById(id: string): Promise<AuthCustomer | null> {
  const pool = getDbPool();
  const query = `
    SELECT id, email, full_name, created_at
    FROM customers
    WHERE id = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query<{
    id: string;
    email: string;
    full_name: string;
    created_at: Date;
  }>(query, [id]);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at.toISOString(),
  };
}
