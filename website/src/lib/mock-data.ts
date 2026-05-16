/**
 * Mock data for Tecida Tray Track.
 * Replace these with real API calls when the FastAPI backend is ready.
 */

import type {
  AdminUser,
  Employee,
  MenuItem,
  Transaction,
  ScannedItem,
  AdminStats,
  ApiResponse,
  PaymentMethod,
  Receipt,
} from "@/types";

export const MOCK_ADMIN_USERS: AdminUser[] = [];

// ---- EMPLOYEES ----
export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    name: "Aarav Sharma",
    department: "Engineering",
    email: "aarav.sharma@tecida.com",
    avatar: null,
    accountBalance: 1250.0,
    joinDate: "2024-03-15",
    status: "active",
    totalTransactions: 3,
    totalSpent: 590,
    lastTransactionAt: "2026-04-15T12:30:00",
    primaryPaymentMethod: "account",
    assignedCashierId: "USR-002",
  },
  {
    id: "EMP-002",
    name: "Priya Patel",
    department: "Design",
    email: "priya.patel@tecida.com",
    avatar: null,
    accountBalance: 680.5,
    joinDate: "2024-06-01",
    status: "active",
    totalTransactions: 1,
    totalSpent: 200,
    lastTransactionAt: "2026-04-15T12:15:00",
    primaryPaymentMethod: "immediate",
    assignedCashierId: "USR-002",
  },
  {
    id: "EMP-003",
    name: "Rahul Verma",
    department: "Operations",
    email: "rahul.verma@tecida.com",
    avatar: null,
    accountBalance: 0,
    joinDate: "2023-11-20",
    status: "active",
    totalTransactions: 1,
    totalSpent: 250,
    lastTransactionAt: "2026-04-15T12:50:00",
    primaryPaymentMethod: "account",
    assignedCashierId: "USR-001",
  },
  {
    id: "EMP-004",
    name: "Sneha Gupta",
    department: "Marketing",
    email: "sneha.gupta@tecida.com",
    avatar: null,
    accountBalance: 320.0,
    joinDate: "2025-01-10",
    status: "on_leave",
    totalTransactions: 0,
    totalSpent: 0,
    lastTransactionAt: null,
    primaryPaymentMethod: null,
    assignedCashierId: "USR-003",
  },
  {
    id: "EMP-005",
    name: "Vikram Singh",
    department: "Finance",
    email: "vikram.singh@tecida.com",
    avatar: null,
    accountBalance: 1890.0,
    joinDate: "2023-08-05",
    status: "inactive",
    totalTransactions: 0,
    totalSpent: 0,
    lastTransactionAt: null,
    primaryPaymentMethod: null,
    assignedCashierId: "USR-001",
  },
];

// ---- MENU ITEMS ----
export const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: "ITEM-001", name: "Paneer Butter Masala", category: "Main Course", price: 120, image: null, available: true, calories: 350 },
  { id: "ITEM-002", name: "Jeera Rice", category: "Rice", price: 60, image: null, available: true, calories: 220 },
  { id: "ITEM-003", name: "Dal Tadka", category: "Main Course", price: 80, image: null, available: true, calories: 180 },
  { id: "ITEM-004", name: "Butter Naan", category: "Bread", price: 30, image: null, available: true, calories: 150 },
  { id: "ITEM-005", name: "Mixed Veg Curry", category: "Main Course", price: 100, image: null, available: true, calories: 200 },
  { id: "ITEM-006", name: "Chicken Biryani", category: "Rice", price: 180, image: null, available: true, calories: 450 },
  { id: "ITEM-007", name: "Raita", category: "Side", price: 30, image: null, available: true, calories: 80 },
  { id: "ITEM-008", name: "Gulab Jamun (2 pcs)", category: "Dessert", price: 50, image: null, available: true, calories: 300 },
  { id: "ITEM-009", name: "Masala Chai", category: "Beverage", price: 20, image: null, available: true, calories: 90 },
  { id: "ITEM-010", name: "Green Salad", category: "Side", price: 40, image: null, available: true, calories: 60 },
  { id: "ITEM-011", name: "Chole Bhature", category: "Main Course", price: 110, image: null, available: false, calories: 400 },
  { id: "ITEM-012", name: "Lassi (Sweet)", category: "Beverage", price: 40, image: null, available: true, calories: 150 },
];

// ---- MOCK TRANSACTION HISTORY ----
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 30, 0, 0);
  return d.toISOString();
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-0041",
    employeeId: "EMP-001",
    date: daysAgo(0), // today
    items: [
      { name: "Paneer Butter Masala", qty: 1, price: 120 },
      { name: "Jeera Rice", qty: 1, price: 60 },
      { name: "Masala Chai", qty: 1, price: 20 },
    ],
    total: 200,
    paymentMethod: "account",
    status: "completed",
  },
  {
    id: "TXN-0040",
    employeeId: "EMP-001",
    date: daysAgo(1), // yesterday
    items: [
      { name: "Chicken Biryani", qty: 1, price: 180 },
      { name: "Raita", qty: 1, price: 30 },
    ],
    total: 210,
    paymentMethod: "immediate",
    status: "completed",
  },
  {
    id: "TXN-0039",
    employeeId: "EMP-001",
    date: daysAgo(2),
    items: [
      { name: "Dal Tadka", qty: 1, price: 80 },
      { name: "Butter Naan", qty: 2, price: 60 },
      { name: "Green Salad", qty: 1, price: 40 },
    ],
    total: 180,
    paymentMethod: "account",
    status: "completed",
  },
  {
    id: "TXN-0038",
    employeeId: "EMP-002",
    date: daysAgo(0), // today
    items: [
      { name: "Mixed Veg Curry", qty: 1, price: 100 },
      { name: "Jeera Rice", qty: 1, price: 60 },
      { name: "Lassi (Sweet)", qty: 1, price: 40 },
    ],
    total: 200,
    paymentMethod: "immediate",
    status: "completed",
  },
  {
    id: "TXN-0037",
    employeeId: "EMP-003",
    date: daysAgo(0), // today
    items: [
      { name: "Chicken Biryani", qty: 1, price: 180 },
      { name: "Gulab Jamun (2 pcs)", qty: 1, price: 50 },
      { name: "Masala Chai", qty: 1, price: 20 },
    ],
    total: 250,
    paymentMethod: "account",
    status: "completed",
  },
];

// ---- ADMIN STATS ----
export const MOCK_ADMIN_STATS: AdminStats = {
  mealsToday: 147,
  revenueToday: 18340,
  activeUsers: 52,
  popularItem: "Chicken Biryani",
  avgMealCost: 125,
  monthlyRevenue: 412500,
  yearlyRevenue: 3200000,
};

// ---- MOCK API HELPERS ----
function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Look up employee by ID */
export async function fetchEmployeeById(empId: string): Promise<ApiResponse<Employee>> {
  await delay(600);
  const emp = MOCK_EMPLOYEES.find(
    (e) => e.id.toLowerCase() === empId.toLowerCase()
  );
  if (!emp) return { ok: false, error: "Employee not found" };
  return { ok: true, data: emp };
}

/** Get transactions for an employee */
export async function fetchEmployeeTransactions(empId: string): Promise<ApiResponse<Transaction[]>> {
  await delay(400);
  const txns = MOCK_TRANSACTIONS.filter(
    (t) => t.employeeId.toLowerCase() === empId.toLowerCase()
  );
  return { ok: true, data: txns };
}

/** Submit payment */
export async function submitPayment(
  employeeId: string,
  items: ScannedItem[],
  method: PaymentMethod
): Promise<ApiResponse<Receipt>> {
  await delay(1000);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return {
    ok: true,
    data: {
      transactionId: `TXN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      employeeId,
      items,
      total,
      paymentMethod: method,
      date: new Date().toISOString(),
      status: "completed",
    },
  };
}
