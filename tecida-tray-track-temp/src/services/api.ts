/**
 * API service layer for Tecida Tray Track.
 *
 * Currently uses mock data functions. When the FastAPI backend is ready,
 * replace each function body with a real fetch/axios call to the backend.
 *
 * All functions return ApiResponse<T> for consistent error handling.
 */

import type {
  Employee,
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
  runTrayScan,
  submitPayment as mockSubmitPayment,
  MOCK_MENU_ITEMS,
  MOCK_ADMIN_STATS,
  MOCK_EMPLOYEES,
  MOCK_TRANSACTIONS,
} from "@/lib/mock-data";

import { API_BASE } from "@/lib/constants";

// ──────────────────────────────────────────────
// Employee
// ──────────────────────────────────────────────

/** Fetch a single employee by their ID */
export async function getEmployee(id: string): Promise<ApiResponse<Employee>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/employees/${id}
  return fetchEmployeeById(id);
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
 * @param imageBlob - JPEG frame captured from the camera
 */
export async function scanTray(
  imageBlob?: Blob
): Promise<ApiResponse<ScannedItem[]>> {
  // TODO: Replace with real endpoint:
  // const formData = new FormData();
  // formData.append("image", imageBlob, "tray.jpg");
  // const res = await fetch(`${API_BASE}/scan`, { method: "POST", body: formData });
  // const data = await res.json();
  // return { ok: true, data: data.items };

  // For now, simulate scan with mock data (ignores image)
  return runTrayScan();
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
  // TODO: Replace with real endpoint → POST ${API_BASE}/payments
  return mockSubmitPayment(employeeId, items, method);
}

// ──────────────────────────────────────────────
// Menu Items (Admin)
// ──────────────────────────────────────────────

/** Fetch all menu items */
export async function getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/menu
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, data: MOCK_MENU_ITEMS };
}

/** Create a new menu item */
export async function createMenuItem(
  item: Omit<MenuItem, "id">
): Promise<ApiResponse<MenuItem>> {
  // TODO: Replace with real endpoint → POST ${API_BASE}/menu
  await new Promise((r) => setTimeout(r, 500));
  const newItem: MenuItem = {
    ...item,
    id: `ITEM-${String(Math.floor(Math.random() * 900) + 100)}`,
  };
  return { ok: true, data: newItem };
}

/** Update an existing menu item */
export async function updateMenuItem(
  id: string,
  updates: Partial<MenuItem>
): Promise<ApiResponse<MenuItem>> {
  // TODO: Replace with real endpoint → PUT ${API_BASE}/menu/${id}
  await new Promise((r) => setTimeout(r, 500));
  const existing = MOCK_MENU_ITEMS.find((m) => m.id === id);
  if (!existing) return { ok: false, error: "Menu item not found" };
  return { ok: true, data: { ...existing, ...updates } };
}

/** Delete a menu item */
export async function deleteMenuItem(id: string): Promise<ApiResponse<null>> {
  // TODO: Replace with real endpoint → DELETE ${API_BASE}/menu/${id}
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, data: null };
}

// ──────────────────────────────────────────────
// Admin
// ──────────────────────────────────────────────

/** Fetch all employees for admin panel */
export async function getAllEmployees(): Promise<ApiResponse<Employee[]>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/employees
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, data: MOCK_EMPLOYEES };
}

/** Fetch all transactions for admin panel */
export async function getAllTransactions(): Promise<ApiResponse<Transaction[]>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/transactions
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, data: MOCK_TRANSACTIONS };
}

/** Fetch admin dashboard stats */
export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  // TODO: Replace with real endpoint → GET ${API_BASE}/admin/stats
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, data: MOCK_ADMIN_STATS };
}
