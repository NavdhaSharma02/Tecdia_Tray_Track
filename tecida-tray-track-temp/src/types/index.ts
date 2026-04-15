// ============================================
// Tecida Tray Track — Shared TypeScript Types
// ============================================

/** Steps in the customer kiosk flow */
export type FlowStep = 'IDLE' | 'PROFILE' | 'SCANNING' | 'RESULTS' | 'PAYMENT' | 'DONE';

/** Payment method options */
export type PaymentMethod = 'immediate' | 'account';

/** Employee record */
export interface Employee {
  id: string;
  name: string;
  department: string;
  email: string;
  avatar: string | null;
  accountBalance: number;
  joinDate: string;
}

/** Menu item in the cafeteria */
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  available: boolean;
  calories: number;
}

/** Item detected during tray scan */
export interface ScannedItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  confidence: number;
  calories: number;
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
  | { type: 'START_SCAN' }
  | { type: 'SCAN_COMPLETE'; payload: ScannedItem[] }
  | { type: 'UPDATE_ITEMS'; payload: ScannedItem[] }
  | { type: 'SELECT_PAYMENT'; payload: PaymentMethod }
  | { type: 'PAYMENT_COMPLETE'; payload: Receipt }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };
