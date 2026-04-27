// ============================================
// Tecida Tray Track — Shared TypeScript Types
// ============================================

/** Steps in the customer kiosk flow */
export type FlowStep =
  | "IDLE"
  | "EMAIL_AUTH"
  | "PROFILE"
  | "SCANNING"
  | "BILL"
  | "PAYMENT"
  | "DONE";

/** Payment method options */
export type PaymentMethod = 'immediate' | 'account';

export type AdminRole = "admin" | "cashier";

/** Employee record */
export interface Employee {
  id: string;
  name: string;
  department: string;
  email: string;
  avatar: string | null;
  accountBalance: number;
  joinDate: string;
  status?: "active" | "on_leave" | "inactive";
  totalTransactions?: number;
  totalSpent?: number;
  lastTransactionAt?: string | null;
  primaryPaymentMethod?: PaymentMethod | null;
  assignedCashierId?: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited" | "suspended";
  shift: string;
  lastActiveAt: string;
  handledTransactions: number;
  scope: string;
 }

/** Menu item in the cafeteria */
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  available: boolean;
  /** Numeric kcal, or null when unknown / “N/A”. */
  calories: number | null;
}

/** Item detected during tray scan */
export interface ScannedItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  confidence: number;
  calories: number | null;
}

/** Single item in a transaction */
export interface TransactionItem {
  name: string;
  qty: number;
  price: number;
}

/** Transaction record */
export interface Transaction {
  id: string;
  employeeId: string;
  date: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: 'completed' | 'pending' | 'failed';
}

/** Payment receipt returned after successful payment */
export interface Receipt {
  transactionId: string;
  employeeId: string;
  items: ScannedItem[];
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  status: string;
}

export interface CustomerTransactionSummary {
  id: string;
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  status: string;
}

export interface FeedbackEntry {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  transactionId: string | null;
  issueText: string;
  createdAt: string;
}

/** Admin dashboard aggregated stats */
export interface AdminStats {
  mealsToday: number;
  revenueToday: number;
  activeUsers: number;
  popularItem: string;
  avgMealCost: number;
  monthlyRevenue: number;
}

/** Generic API response wrapper */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface AuthCustomer {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

/** Customer flow state */
export interface CustomerFlowState {
  step: FlowStep;
  employee: Employee | null;
  transactions: Transaction[];
  scannedItems: ScannedItem[];
  paymentMethod: PaymentMethod | null;
  receipt: Receipt | null;
  error: string | null;
  isLoading: boolean;
}

/** Customer flow action types */
export type CustomerFlowAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_EMPLOYEE'; payload: { employee: Employee; transactions: Transaction[] } }
  | { type: "SET_STEP"; payload: FlowStep }
  | { type: "RESET_TO_EMAIL_AUTH" }
  | { type: 'START_SCAN' }
  | { type: 'SCAN_COMPLETE'; payload: ScannedItem[] }
  | { type: 'UPDATE_ITEMS'; payload: ScannedItem[] }
  | { type: 'SELECT_PAYMENT'; payload: PaymentMethod }
  | { type: 'PAYMENT_COMPLETE'; payload: Receipt }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };
