import { getDbPool } from "@/lib/db";

export interface AuthCustomer {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  department: string;
  createdAt: string;
}

interface CustomerRow {
  id: string;
  employee_code: string;
  email: string;
  full_name: string;
  department: string;
  password_hash: string;
  password_salt: string;
  created_at: Date;
}

export async function createCustomer(input: {
  employeeCode: string;
  email: string;
  fullName: string;
  department: string;
  passwordHash: string;
  passwordSalt: string;
}): Promise<AuthCustomer> {
  const pool = getDbPool();
  const query = `
    INSERT INTO customers (
      employee_code,
      email,
      full_name,
      department,
      password_hash,
      password_salt
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, employee_code, email, full_name, department, created_at;
  `;

  const { rows } = await pool.query<{
    id: string;
    employee_code: string;
    email: string;
    full_name: string;
    department: string;
    created_at: Date;
  }>(query, [
    input.employeeCode,
    input.email,
    input.fullName,
    input.department,
    input.passwordHash,
    input.passwordSalt,
  ]);

  const row = rows[0];
  return {
    id: row.id,
    employeeCode: row.employee_code,
    email: row.email,
    fullName: row.full_name,
    department: row.department,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findCustomerByEmail(
  email: string
): Promise<(AuthCustomer & { passwordHash: string; passwordSalt: string }) | null> {
  const pool = getDbPool();
  const query = `
    SELECT
      id,
      employee_code,
      email,
      full_name,
      department,
      password_hash,
      password_salt,
      created_at
    FROM customers
    WHERE email = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query<CustomerRow>(query, [email]);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    id: row.id,
    employeeCode: row.employee_code,
    email: row.email,
    fullName: row.full_name,
    department: row.department,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findCustomerByEmployeeCode(
  employeeCode: string
): Promise<AuthCustomer | null> {
  const pool = getDbPool();
  const query = `
    SELECT id, employee_code, email, full_name, department, created_at
    FROM customers
    WHERE employee_code = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query<{
    id: string;
    employee_code: string;
    email: string;
    full_name: string;
    department: string;
    created_at: Date;
  }>(query, [employeeCode.trim().toUpperCase()]);
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id,
    employeeCode: row.employee_code,
    email: row.email,
    fullName: row.full_name,
    department: row.department,
    createdAt: row.created_at.toISOString(),
  };
}

export async function findCustomerById(id: string): Promise<AuthCustomer | null> {
  const pool = getDbPool();
  const query = `
    SELECT id, employee_code, email, full_name, department, created_at
    FROM customers
    WHERE id = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query<{
    id: string;
    employee_code: string;
    email: string;
    full_name: string;
    department: string;
    created_at: Date;
  }>(query, [id]);
  if (!rows.length) return null;

  const row = rows[0];
  return {
    id: row.id,
    employeeCode: row.employee_code,
    email: row.email,
    fullName: row.full_name,
    department: row.department,
    createdAt: row.created_at.toISOString(),
  };
}

export async function updateCustomerPassword(input: {
  customerId: string;
  passwordHash: string;
  passwordSalt: string;
}): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    `
    UPDATE customers
    SET password_hash = $2,
        password_salt = $3,
        updated_at = NOW()
    WHERE id = $1::uuid;
    `,
    [input.customerId, input.passwordHash, input.passwordSalt]
  );
}
