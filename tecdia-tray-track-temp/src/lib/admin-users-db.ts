import { getDbPool } from "@/lib/db";
import type { AdminRole, AdminUser } from "@/types";

interface StaffUserRow {
  id: string;
  user_code: string;
  full_name: string;
  description: string;
  email: string;
  role: AdminRole;
  shift: string;
  status: "active" | "invited" | "suspended";
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: StaffUserRow): AdminUser {
  return {
    id: row.user_code,
    name: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    shift: row.shift,
    scope: row.description,
  };
}

export async function listStaffUsers(): Promise<AdminUser[]> {
  const pool = getDbPool();
  const { rows } = await pool.query<StaffUserRow>(
    `
    SELECT id, user_code, full_name, description, email, role, shift, status, created_at, updated_at
    FROM staff_users
    ORDER BY user_code ASC;
    `
  );
  return rows.map(mapRow);
}

async function nextUserCode(): Promise<string> {
  const pool = getDbPool();
  const { rows } = await pool.query<{ max_num: string | null }>(
    `
    SELECT MAX(CAST(SUBSTRING(user_code FROM 5) AS INTEGER))::text AS max_num
    FROM staff_users
    WHERE user_code ~ '^USR-[0-9]+$';
    `
  );
  const next = Number(rows[0]?.max_num || 0) + 1;
  return `USR-${String(next).padStart(3, "0")}`;
}

export async function createStaffUser(input: {
  userCode?: string;
  name: string;
  description: string;
  email: string;
  role: AdminRole;
  shift: string;
  status: "active" | "invited" | "suspended";
}): Promise<AdminUser> {
  const pool = getDbPool();
  const userCode = (input.userCode?.trim() || (await nextUserCode())).toUpperCase();
  const { rows } = await pool.query<StaffUserRow>(
    `
    INSERT INTO staff_users (user_code, full_name, description, email, role, shift, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_code, full_name, description, email, role, shift, status, created_at, updated_at;
    `,
    [
      userCode,
      input.name.trim(),
      input.description.trim(),
      input.email.trim().toLowerCase(),
      input.role,
      input.shift.trim(),
      input.status,
    ]
  );
  return mapRow(rows[0]);
}

export async function updateStaffUserByCode(
  userCode: string,
  input: {
    userCode?: string;
    name: string;
    description: string;
    email: string;
    role: AdminRole;
    shift: string;
    status: "active" | "invited" | "suspended";
  }
): Promise<AdminUser | null> {
  const pool = getDbPool();
  const nextCode = (input.userCode?.trim() || userCode).toUpperCase();
  const { rows } = await pool.query<StaffUserRow>(
    `
    UPDATE staff_users
    SET user_code = $2,
        full_name = $3,
        description = $4,
        email = $5,
        role = $6,
        shift = $7,
        status = $8,
        updated_at = NOW()
    WHERE user_code = $1
    RETURNING id, user_code, full_name, description, email, role, shift, status, created_at, updated_at;
    `,
    [
      userCode.trim().toUpperCase(),
      nextCode,
      input.name.trim(),
      input.description.trim(),
      input.email.trim().toLowerCase(),
      input.role,
      input.shift.trim(),
      input.status,
    ]
  );
  if (!rows[0]) return null;
  return mapRow(rows[0]);
}

export async function deleteStaffUserByCode(userCode: string): Promise<boolean> {
  const pool = getDbPool();
  const result = await pool.query(
    `DELETE FROM staff_users WHERE user_code = $1 RETURNING id;`,
    [userCode.trim().toUpperCase()]
  );
  return (result.rowCount ?? 0) > 0;
}
