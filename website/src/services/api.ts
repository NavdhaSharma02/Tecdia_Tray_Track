/** API client for kiosk and admin (Next.js route handlers on localhost). */

import type {
  AdminUser,
  AuthCustomer,
  CustomerTransactionSummary,
  Employee,
  FeedbackEntry,
  MenuItem,
  Transaction,
  ScannedItem,
  Receipt,
  AdminStats,
  ApiResponse,
  PaymentMethod,
} from "@/types";

import { submitPayment as mockSubmitPayment } from "@/lib/mock-data";
import type { AdminRole } from "@/types";

import { API_BASE } from "@/lib/constants";

interface AuthResponse {
  customer: AuthCustomer;
}

// ──────────────────────────────────────────────
// Employee
// ──────────────────────────────────────────────

/** Fetch a single employee by their ID (employee code). */
export async function getEmployee(id: string): Promise<ApiResponse<Employee>> {
  try {
    const res = await fetch(
      `${API_BASE}/customer/employees/${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );
    const data = (await res.json()) as ApiResponse<Employee>;
    if (!res.ok) return { ok: false, error: data.error || "Employee not found." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load employee." };
  }
}

/** Fetch logged-in customer profile with live account balance. */
export async function getCustomerProfile(): Promise<ApiResponse<Employee>> {
  try {
    const res = await fetch(`${API_BASE}/customer/profile`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json()) as ApiResponse<Employee>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load profile." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load profile." };
  }
}

export async function signUpCustomer(input: {
  employeeCode: string;
  email: string;
  fullName: string;
  department: string;
}): Promise<ApiResponse<AuthResponse>> {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as ApiResponse<AuthResponse>;
    if (!res.ok) return { ok: false, error: data.error || "Signup failed" };
    return data;
  } catch {
    return { ok: false, error: "Unable to reach signup service." };
  }
}

export async function loginCustomer(input: {
  email: string;
  password: string;
}): Promise<ApiResponse<AuthResponse>> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as ApiResponse<AuthResponse>;
    if (!res.ok) return { ok: false, error: data.error || "Login failed" };
    return data;
  } catch {
    return { ok: false, error: "Unable to reach login service." };
  }
}

export async function loginCustomerByEmployeeCode(input: {
  employeeCode: string;
}): Promise<ApiResponse<AuthResponse>> {
  try {
    const res = await fetch(`${API_BASE}/auth/login-by-employee-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as ApiResponse<AuthResponse>;
    if (!res.ok) return { ok: false, error: data.error || "Login failed" };
    return data;
  } catch {
    return { ok: false, error: "Unable to reach login service." };
  }
}

export async function resetCustomerPassword(input: {
  email: string;
  adminPin: string;
  newPassword: string;
}): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as ApiResponse<null>;
    if (!res.ok) return { ok: false, error: data.error || "Password reset failed." };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Unable to reset password." };
  }
}

/** Fetch transaction history for the logged-in customer. */
export async function getEmployeeTransactions(
  _employeeId: string
): Promise<ApiResponse<Transaction[]>> {
  try {
    const res = await fetch(`${API_BASE}/customer/transactions`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json()) as ApiResponse<CustomerTransactionSummary[]>;
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to load transactions." };
    }
    const transactions: Transaction[] = (data.data || []).map((row) => ({
      id: row.id,
      employeeId: _employeeId,
      items: [],
      total: row.total,
      paymentMethod: row.paymentMethod,
      date: row.date,
      status: row.status as Transaction["status"],
    }));
    return { ok: true, data: transactions };
  } catch {
    return { ok: false, error: "Unable to load transactions." };
  }
}

// ──────────────────────────────────────────────
/** Today's available menu for kiosk manual billing. */
export async function getTodayMenu(): Promise<ApiResponse<MenuItem[]>> {
  try {
    const res = await fetch(`${API_BASE}/menu/today`, { cache: "no-store" });
    const data = (await res.json()) as ApiResponse<MenuItem[]>;
    if (!res.ok) {
      return { ok: false, error: data.error || "Could not load today's menu." };
    }
    return data;
  } catch {
    return { ok: false, error: "Could not load today's menu." };
  }
}

// Tray Scanning
// ──────────────────────────────────────────────

/**
 * Send a captured camera frame to local /api/scan for CLIP matching.
 * Requests stay on localhost (same tablet) — no cloud dependency at runtime.
 * Falls back to simulation only when the app server is unreachable.
 */
export async function scanTray(
  imageBlob?: Blob
): Promise<ApiResponse<ScannedItem[]>> {
  if (!imageBlob) {
    return {
      ok: false,
      error: "Camera not ready. Position the tray and try again.",
    };
  }

  const form = new FormData();
  form.append("image", imageBlob, "tray.jpg");

  try {
    const res = await fetch(`${API_BASE}/scan`, {
      method: "POST",
      body: form,
    });
    const json = (await res.json()) as ApiResponse<ScannedItem[]> & {
      meta?: { mode?: string; message?: string };
    };

    if (res.ok && json.ok && json.data?.length) {
      return { ok: true, data: json.data };
    }

    return {
      ok: false,
      error:
        json.error ||
        "Could not recognize dishes. Ask staff to verify today's reference photos.",
    };
  } catch {
    return {
      ok: false,
      error: "Scan service unavailable. Ensure the app is running on this tablet.",
    };
  }
}

/** Upload today's reference photos; server computes and stores CLIP embedding. */
export async function uploadMenuItemReferenceImage(
  menuItemId: string,
  files: File[]
): Promise<
  ApiResponse<{
    menuItemId: string;
    hasEmbedding: boolean;
    hasReferencePhoto?: boolean;
    imageUrl: string;
    dimensions: number;
    referencePhotoCount?: number;
    warning?: string;
  }>
> {
  const form = new FormData();
  files.forEach((file) => {
    form.append("images", file, file.name || "reference.jpg");
  });

  try {
    const res = await fetch(
      `${API_BASE}/admin/today-menu/${encodeURIComponent(menuItemId)}/image`,
      { method: "POST", body: form }
    );
    const data = (await res.json()) as ApiResponse<{
      menuItemId: string;
      hasEmbedding: boolean;
      hasReferencePhoto?: boolean;
      imageUrl: string;
      dimensions: number;
      referencePhotoCount?: number;
      warning?: string;
    }>;
    if (!res.ok) {
      return { ok: false, error: data.error || "Image upload failed." };
    }
    return data;
  } catch {
    return { ok: false, error: "Could not reach image upload service." };
  }
}

export async function importVisionTrainingBank(): Promise<
  ApiResponse<{
    skipped: boolean;
    reason?: string;
    inserted: number;
    matched: number;
    unmatchedClasses: string[];
    totalPrototypesInBank: number;
  }>
> {
  try {
    const res = await fetch(`${API_BASE}/admin/ml/import-vision`, {
      method: "POST",
    });
    const data = (await res.json()) as ApiResponse<{
      skipped: boolean;
      reason?: string;
      inserted: number;
      matched: number;
      unmatchedClasses: string[];
      totalPrototypesInBank: number;
    }>;
    if (!res.ok) {
      return { ok: false, error: data.error || "Import failed." };
    }
    return data;
  } catch {
    return { ok: false, error: "Could not reach vision import service." };
  }
}

export async function rebuildMenuReferenceEmbeddings(): Promise<
  ApiResponse<{
    processed: number;
    succeeded: number;
    failed: { menuItemId: string; name: string; error: string }[];
  }>
> {
  try {
    const res = await fetch(`${API_BASE}/admin/ml/rebuild-references`, {
      method: "POST",
    });
    const data = (await res.json()) as ApiResponse<{
      processed: number;
      succeeded: number;
      failed: { menuItemId: string; name: string; error: string }[];
    }>;
    if (!res.ok) {
      return { ok: false, error: data.error || "Rebuild failed." };
    }
    return data;
  } catch {
    return { ok: false, error: "Could not reach vision rebuild service." };
  }
}

export async function deleteMenuItemReferenceImage(
  menuItemId: string
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/today-menu/${encodeURIComponent(menuItemId)}/image`,
      { method: "DELETE" }
    );
    const data = (await res.json()) as ApiResponse<null>;
    if (!res.ok) {
      return { ok: false, error: data.error || "Could not remove image." };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Could not reach image service." };
  }
}

export async function logoutCustomer(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
  } catch {
    /* kiosk: ignore network errors on logout */
  }
}

// ──────────────────────────────────────────────
// Payment
// ──────────────────────────────────────────────

/** Submit payment for scanned items */
export async function processPayment(
  employeeId: string,
  items: ScannedItem[],
  method: PaymentMethod
): Promise<ApiResponse<Receipt>> {
  try {
    const res = await fetch(`${API_BASE}/customer/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        paymentMethod: method,
      }),
    });
    const data = (await res.json()) as ApiResponse<Receipt>;
    if (res.ok && data.ok && data.data) {
      return data;
    }
  } catch {
    // fallback to mock below
  }
  return mockSubmitPayment(employeeId, items, method);
}

export async function getCustomerTransactions(): Promise<
  ApiResponse<CustomerTransactionSummary[]>
> {
  try {
    const res = await fetch(`${API_BASE}/customer/transactions`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json()) as ApiResponse<CustomerTransactionSummary[]>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load transactions." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load transactions." };
  }
}

export async function submitCustomerFeedback(input: {
  issueText: string;
  transactionId?: string | null;
}): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE}/customer/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as ApiResponse<null>;
    if (!res.ok) return { ok: false, error: data.error || "Feedback submit failed." };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Unable to submit feedback." };
  }
}

// ──────────────────────────────────────────────
// Menu Items (Admin)
// ──────────────────────────────────────────────

/** Today's menu for admin (all rows, including unavailable). */
export async function getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
  try {
    const res = await fetch(`${API_BASE}/admin/today-menu`, { cache: "no-store" });
    const data = (await res.json()) as ApiResponse<MenuItem[]>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load menu" };
    return data;
  } catch {
    return { ok: false, error: "Unable to reach menu service." };
  }
}

/** Set prices for permanent rice_big / rice_small menu items. */
export async function savePermanentRicePrices(prices: {
  rice_big: number;
  rice_small: number;
}): Promise<ApiResponse<{ rice_big: MenuItem; rice_small: MenuItem }>> {
  try {
    const res = await fetch(`${API_BASE}/admin/today-menu/rice`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prices),
    });
    const data = (await res.json()) as ApiResponse<{
      rice_big: MenuItem;
      rice_small: MenuItem;
    }>;
    if (!res.ok) return { ok: false, error: data.error || "Could not save rice prices." };
    return data;
  } catch {
    return { ok: false, error: "Unable to save rice prices." };
  }
}

/** Set whether free Sebaw soup is available on today's menu. */
export async function saveSebawToday(
  available: boolean
): Promise<ApiResponse<MenuItem>> {
  try {
    const res = await fetch(`${API_BASE}/admin/today-menu/sebaw`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available }),
    });
    const data = (await res.json()) as ApiResponse<MenuItem>;
    if (!res.ok) return { ok: false, error: data.error || "Could not save Sebaw." };
    return data;
  } catch {
    return { ok: false, error: "Unable to save Sebaw." };
  }
}

/** Create a new menu item on today's service day */
export async function createMenuItem(
  item: Omit<MenuItem, "id">
): Promise<ApiResponse<MenuItem>> {
  try {
    const res = await fetch(`${API_BASE}/admin/today-menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        price: item.price,
        calories: item.calories,
        available: item.available,
      }),
    });
    const data = (await res.json()) as ApiResponse<MenuItem>;
    if (!res.ok) return { ok: false, error: data.error || "Create failed" };
    return data;
  } catch {
    return { ok: false, error: "Unable to create menu item." };
  }
}

/** Update a menu item that appears on today's service day */
export async function updateMenuItem(
  id: string,
  item: MenuItem
): Promise<ApiResponse<MenuItem>> {
  try {
    const res = await fetch(`${API_BASE}/admin/today-menu/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        price: item.price,
        calories: item.calories,
        available: item.available,
      }),
    });
    const data = (await res.json()) as ApiResponse<MenuItem>;
    if (!res.ok) return { ok: false, error: data.error || "Update failed" };
    return data;
  } catch {
    return { ok: false, error: "Unable to update menu item." };
  }
}

/** Remove item from today's menu (row unlinked for current service date) */
export async function deleteMenuItem(id: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE}/admin/today-menu/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = (await res.json()) as ApiResponse<null>;
    if (!res.ok) return { ok: false, error: (data as { error?: string }).error || "Delete failed" };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Unable to delete menu item." };
  }
}

// ──────────────────────────────────────────────
// Admin
// ──────────────────────────────────────────────

/** Fetch all employees for admin panel */
export async function getAllEmployees(): Promise<ApiResponse<Employee[]>> {
  try {
    const res = await fetch(`${API_BASE}/admin/employees`, { cache: "no-store" });
    const data = (await res.json()) as ApiResponse<Employee[]>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load employees." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load employees." };
  }
}

export async function updateEmployeeProfile(
  currentEmployeeCode: string,
  input: { employeeCode: string; fullName: string; department: string }
): Promise<ApiResponse<Employee>> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/employees/${encodeURIComponent(currentEmployeeCode)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );
    const data = (await res.json()) as ApiResponse<Employee>;
    if (!res.ok) return { ok: false, error: data.error || "Could not update employee." };
    return data;
  } catch {
    return { ok: false, error: "Unable to update employee." };
  }
}

export async function removeEmployee(
  employeeCode: string
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/employees/${encodeURIComponent(employeeCode)}`,
      { method: "DELETE" }
    );
    const data = (await res.json()) as ApiResponse<null>;
    if (!res.ok) return { ok: false, error: data.error || "Could not remove employee." };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Unable to remove employee." };
  }
}

export async function getAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, { cache: "no-store" });
    const data = (await res.json()) as ApiResponse<AdminUser[]>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load users." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load users." };
  }
}

export async function createAdminUser(input: {
  adminPin: string;
  userCode?: string;
  name: string;
  description: string;
  email: string;
  role: AdminRole;
  shift: string;
  status: "active" | "invited" | "suspended";
}): Promise<ApiResponse<AdminUser>> {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPin: input.adminPin,
        userCode: input.userCode,
        name: input.name,
        description: input.description,
        email: input.email,
        role: input.role,
        shift: input.shift,
        status: input.status,
      }),
    });
    const data = (await res.json()) as ApiResponse<AdminUser>;
    if (!res.ok) return { ok: false, error: data.error || "Could not create user." };
    return data;
  } catch {
    return { ok: false, error: "Unable to create user." };
  }
}

export async function updateAdminUser(
  currentUserCode: string,
  input: {
    adminPin: string;
    userCode?: string;
    name: string;
    description: string;
    email: string;
    role: AdminRole;
    shift: string;
    status: "active" | "invited" | "suspended";
  }
): Promise<ApiResponse<AdminUser>> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/users/${encodeURIComponent(currentUserCode)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPin: input.adminPin,
          userCode: input.userCode,
          name: input.name,
          description: input.description,
          email: input.email,
          role: input.role,
          shift: input.shift,
          status: input.status,
        }),
      }
    );
    const data = (await res.json()) as ApiResponse<AdminUser>;
    if (!res.ok) return { ok: false, error: data.error || "Could not update user." };
    return data;
  } catch {
    return { ok: false, error: "Unable to update user." };
  }
}

export async function deleteAdminUser(
  userCode: string,
  adminPin: string
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/users/${encodeURIComponent(userCode)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPin }),
      }
    );
    const data = (await res.json()) as ApiResponse<null>;
    if (!res.ok) return { ok: false, error: data.error || "Could not delete user." };
    return data;
  } catch {
    return { ok: false, error: "Unable to delete user." };
  }
}

export async function verifySuperPin(
  pin: string
): Promise<ApiResponse<{ role: "admin" | "cashier" }>> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify-super-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as ApiResponse<{ role: "admin" | "cashier" }>;
    if (!res.ok) return { ok: false, error: data.error || "Incorrect PIN." };
    return data;
  } catch {
    return { ok: false, error: "Unable to verify PIN." };
  }
}

export async function getAdminFeedbacks(): Promise<ApiResponse<FeedbackEntry[]>> {
  try {
    const res = await fetch(`${API_BASE}/admin/feedbacks`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json()) as ApiResponse<FeedbackEntry[]>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load feedbacks." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load feedbacks." };
  }
}

/** Fetch all transactions for admin panel */
export async function getAllTransactions(): Promise<ApiResponse<Transaction[]>> {
  try {
    const res = await fetch(`${API_BASE}/admin/transactions`, { cache: "no-store" });
    const data = (await res.json()) as ApiResponse<Transaction[]>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load transactions." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load transactions." };
  }
}

/** Fetch admin dashboard stats */
export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, { cache: "no-store" });
    const data = (await res.json()) as ApiResponse<AdminStats>;
    if (!res.ok) return { ok: false, error: data.error || "Failed to load stats." };
    return data;
  } catch {
    return { ok: false, error: "Unable to load dashboard stats." };
  }
}
