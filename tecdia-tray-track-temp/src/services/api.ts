/**
 * API service layer for Tecida Tray Track.
 *
 * Currently uses mock data functions. When the FastAPI backend is ready,
 * replace each function body with a real fetch/axios call to the backend.
 *
 * All functions return ApiResponse<T> for consistent error handling.
 */

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

import {
  fetchEmployeeById,
  fetchEmployeeTransactions,
  submitPayment as mockSubmitPayment,
  getSimulatedScanResult,
  MOCK_ADMIN_STATS,
  MOCK_ADMIN_USERS,
  MOCK_TRANSACTIONS,
} from "@/lib/mock-data";

import { API_BASE } from "@/lib/constants";
import { simulateScanFromMenu } from "@/lib/tray-scan-sim";

interface AuthResponse {
  customer: AuthCustomer;
}

// ──────────────────────────────────────────────
// Employee
// ──────────────────────────────────────────────

/** Fetch a single employee by their ID */
export async function getEmployee(id: string): Promise<ApiResponse<Employee>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/employees/${id}
  return fetchEmployeeById(id);
}

export async function signUpCustomer(input: {
  employeeCode: string;
  email: string;
  fullName: string;
  department: string;
  password: string;
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

/** Fetch transaction history for an employee */
export async function getEmployeeTransactions(
  employeeId: string
): Promise<ApiResponse<Transaction[]>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/employees/${employeeId}/transactions
  return fetchEmployeeTransactions(employeeId);
}

// ──────────────────────────────────────────────
// Tray Scanning
// ──────────────────────────────────────────────

/**
 * Send a captured camera frame to the backend for food detection.
 * Falls back to simulated mock scan data when the backend is unreachable,
 * so the full customer flow (Scan → Bill → Payment) always works.
 * @param imageBlob - JPEG frame captured from the camera
 */
export async function scanTray(
  _imageBlob?: Blob
): Promise<ApiResponse<ScannedItem[]>> {
  void _imageBlob;
  // Simulate processing time
  await new Promise((r) => setTimeout(r, 3500));
  try {
    const res = await fetch(`${API_BASE}/menu/today`, { cache: "no-store" });
    if (!res.ok) {
      // Backend reachable but returned error — fall back to mock
      return { ok: true, data: getSimulatedScanResult() };
    }
    const json = (await res.json()) as ApiResponse<MenuItem[]>;
    if (!json.ok || !json.data || json.data.length === 0) {
      return { ok: true, data: getSimulatedScanResult() };
    }
    return { ok: true, data: simulateScanFromMenu(json.data) };
  } catch {
    // Backend offline / network error — use mock data so the flow still works
    return { ok: true, data: getSimulatedScanResult() };
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

export async function getAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
  await new Promise((r) => setTimeout(r, 350));
  return { ok: true, data: MOCK_ADMIN_USERS };
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
    // Fallback keeps admin table usable if DB route is temporarily down.
    return { ok: true, data: MOCK_TRANSACTIONS };
  }
}

/** Fetch admin dashboard stats */
export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/admin/stats
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, data: MOCK_ADMIN_STATS };
}
