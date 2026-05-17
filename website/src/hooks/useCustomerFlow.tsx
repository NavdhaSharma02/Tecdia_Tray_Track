"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  AuthCustomer,
  FlowStep,
  CustomerFlowState,
  CustomerFlowAction,
  Employee,
  Transaction,
  ScannedItem,
  PaymentMethod,
  Receipt,
} from "@/types";
import * as api from "@/services/api";

// ── Initial State ──────────────────────────────

const initialState: CustomerFlowState = {
  step: "IDLE",
  employee: null,
  transactions: [],
  scannedItems: [],
  billingMode: "scan",
  staffBillingAuthorized: false,
  paymentMethod: null,
  receipt: null,
  error: null,
  lastScannedEmployeeCode: null,
  isLoading: false,
};

// ── Reducer ────────────────────────────────────

function flowReducer(
  state: CustomerFlowState,
  action: CustomerFlowAction
): CustomerFlowState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload, error: null };
    case "SET_EMPLOYEE":
      return {
        ...state,
        step: "SCANNING",
        employee: action.payload.employee,
        transactions: action.payload.transactions,
        isLoading: false,
        error: null,
      };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "START_SCAN":
      return { ...state, step: "SCANNING", error: null };
    case "SCAN_COMPLETE":
      return {
        ...state,
        step: "BILL",
        billingMode: "scan",
        staffBillingAuthorized: false,
        scannedItems: action.payload,
        isLoading: false,
        error: null,
      };
    case "ENTER_MANUAL_BILLING":
      return {
        ...state,
        step: "BILL",
        billingMode: "manual",
        staffBillingAuthorized: true,
        scannedItems: [],
        isLoading: false,
        error: null,
      };
    case "BACK_TO_TRAY_SCAN":
      return {
        ...state,
        step: "SCANNING",
        billingMode: "scan",
        staffBillingAuthorized: false,
        scannedItems: [],
        error: null,
      };
    case "STAFF_BILLING_AUTHORIZED":
      return { ...state, staffBillingAuthorized: true };
    case "UPDATE_ITEMS":
      return { ...state, scannedItems: action.payload };
    case "UPDATE_EMPLOYEE":
      return state.employee
        ? { ...state, employee: action.payload }
        : state;
    case "SELECT_PAYMENT":
      return { ...state, paymentMethod: action.payload };
    case "PAYMENT_COMPLETE":
      return {
        ...state,
        step: "DONE",
        receipt: action.payload,
        isLoading: false,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "SET_LAST_SCANNED_EMPLOYEE_CODE":
      return { ...state, lastScannedEmployeeCode: action.payload };
    case "RESET":
      return { ...initialState };
    case "RESET_TO_EMAIL_AUTH":
      return { ...initialState, step: "EMAIL_AUTH" };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────

interface CustomerFlowContextValue extends CustomerFlowState {
  customerAuth: AuthCustomer | null;
  openEmailAuth: () => Promise<void>;
  backToIdScan: () => Promise<void>;
  signUpWithEmail: (input: {
    employeeCode: string;
    fullName: string;
    department: string;
    email: string;
    password: string;
  }) => Promise<boolean>;
  loginWithEmail: (input: { email: string; password: string }) => Promise<boolean>;
  identifyEmployee: (id: string) => Promise<void>;
  startScan: () => void;
  completeScan: (items: ScannedItem[]) => void;
  enterManualBilling: () => void;
  backToTrayScan: () => void;
  authorizeStaffBilling: () => void;
  billingMode: CustomerFlowState["billingMode"];
  staffBillingAuthorized: boolean;
  updateItems: (items: ScannedItem[]) => void;
  selectPayment: (method: PaymentMethod) => void;
  confirmPayment: () => Promise<void>;
  goToPayment: () => void;
  refreshEmployeeBalance: () => Promise<void>;
  setError: (msg: string) => void;
  clearError: () => void;
  reset: () => Promise<void>;
}

const CustomerFlowContext = createContext<CustomerFlowContextValue | null>(null);

// ── Provider ───────────────────────────────────

export function CustomerFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const [customerAuth, setCustomerAuth] = useReducer(
    (_: AuthCustomer | null, next: AuthCustomer | null) => next,
    null
  );

  /**
   * Look up employee by ID, fetch their transactions, and move to PROFILE step.
   */
  const identifyEmployee = useCallback(async (id: string) => {
    const scannedCode = id.trim().toUpperCase();
    dispatch({ type: "SET_LAST_SCANNED_EMPLOYEE_CODE", payload: scannedCode });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const empResult = await api.getEmployee(scannedCode);
      if (!empResult.ok || !empResult.data) {
        dispatch({
          type: "SET_ERROR",
          payload:
            empResult.error
              ? `${empResult.error} (scanned code: ${scannedCode})`
              : `Employee not found for "${scannedCode}". Please try again or use email login.`,
        });
        return;
      }

      const txnResult = await api.getEmployeeTransactions(scannedCode);
      dispatch({
        type: "SET_EMPLOYEE",
        payload: {
          employee: empResult.data,
          transactions: txnResult.data || [],
        },
      });
    } catch {
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to fetch employee details for "${scannedCode}". Please try again.`,
      });
    }
  }, []);

  const openEmailAuth = useCallback(async () => {
    try {
      await api.logoutCustomer();
    } finally {
      setCustomerAuth(null);
      dispatch({ type: "RESET_TO_EMAIL_AUTH" });
    }
  }, []);

  const backToIdScan = useCallback(async () => {
    try {
      await api.logoutCustomer();
    } finally {
      setCustomerAuth(null);
      dispatch({ type: "RESET" });
    }
  }, []);

  const hydrateCustomer = useCallback(
    async (customer: AuthCustomer): Promise<boolean> => {
      setCustomerAuth(customer);

      const [profileResult, txnResult] = await Promise.all([
        api.getCustomerProfile(),
        api.getEmployeeTransactions(customer.employeeCode),
      ]);

      const employee: Employee =
        profileResult.ok && profileResult.data
          ? profileResult.data
          : {
              id: customer.employeeCode,
              name: customer.fullName,
              email: customer.email,
              department: customer.department,
              avatar: null,
              accountBalance: customer.accountBalance ?? 0,
              joinDate: customer.createdAt,
            };

      dispatch({
        type: "SET_EMPLOYEE",
        payload: {
          employee,
          transactions: txnResult.data || [],
        },
      });
      return true;
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (input: {
      employeeCode: string;
      fullName: string;
      department: string;
      email: string;
      password: string;
    }) => {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await api.signUpCustomer(input);
      if (!result.ok || !result.data?.customer) {
        dispatch({ type: "SET_ERROR", payload: result.error || "Signup failed." });
        return false;
      }
      return hydrateCustomer(result.data.customer);
    },
    [hydrateCustomer]
  );

  const loginWithEmail = useCallback(
    async (input: { email: string; password: string }) => {
      dispatch({ type: "SET_LOADING", payload: true });
      const result = await api.loginCustomer(input);
      if (!result.ok || !result.data?.customer) {
        dispatch({ type: "SET_ERROR", payload: result.error || "Login failed." });
        return false;
      }
      return hydrateCustomer(result.data.customer);
    },
    [hydrateCustomer]
  );

  const startScan = useCallback(() => {
    dispatch({ type: "START_SCAN" });
  }, []);

  const completeScan = useCallback((items: ScannedItem[]) => {
    dispatch({ type: "SCAN_COMPLETE", payload: items });
  }, []);

  const enterManualBilling = useCallback(() => {
    dispatch({ type: "ENTER_MANUAL_BILLING" });
  }, []);

  const backToTrayScan = useCallback(() => {
    dispatch({ type: "BACK_TO_TRAY_SCAN" });
  }, []);

  const authorizeStaffBilling = useCallback(() => {
    dispatch({ type: "STAFF_BILLING_AUTHORIZED" });
  }, []);

  const updateItems = useCallback((items: ScannedItem[]) => {
    dispatch({ type: "UPDATE_ITEMS", payload: items });
  }, []);

  const selectPayment = useCallback((method: PaymentMethod) => {
    dispatch({ type: "SELECT_PAYMENT", payload: method });
    dispatch({ type: "SET_STEP", payload: "PAYMENT" });
  }, []);

  const goToPayment = useCallback(() => {
    dispatch({ type: "SET_STEP", payload: "PAYMENT" });
  }, []);

  const refreshEmployeeBalance = useCallback(async () => {
    const profileResult = await api.getCustomerProfile();
    if (profileResult.ok && profileResult.data) {
      dispatch({ type: "UPDATE_EMPLOYEE", payload: profileResult.data });
    }
  }, []);

  /**
   * Process payment using the selected method.
   */
  const confirmPayment = useCallback(async () => {
    if (!state.employee || !state.paymentMethod) return;
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const result = await api.processPayment(
        state.employee.id,
        state.scannedItems,
        state.paymentMethod
      );
      if (!result.ok || !result.data) {
        dispatch({
          type: "SET_ERROR",
          payload: result.error || "Payment failed",
        });
        return;
      }
      dispatch({ type: "PAYMENT_COMPLETE", payload: result.data });
      try {
        await api.logoutCustomer();
      } finally {
        setCustomerAuth(null);
      }
    } catch {
      dispatch({
        type: "SET_ERROR",
        payload: "Payment processing failed. Please try again.",
      });
    }
  }, [state.employee, state.paymentMethod, state.scannedItems]);

  const setError = useCallback((msg: string) => {
    dispatch({ type: "SET_ERROR", payload: msg });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const reset = useCallback(async () => {
    try {
      await api.logoutCustomer();
    } finally {
      setCustomerAuth(null);
      dispatch({ type: "RESET" });
    }
  }, []);

  return (
    <CustomerFlowContext.Provider
      value={{
        ...state,
        customerAuth,
        openEmailAuth,
        backToIdScan,
        signUpWithEmail,
        loginWithEmail,
        identifyEmployee,
        startScan,
        completeScan,
        enterManualBilling,
        backToTrayScan,
        authorizeStaffBilling,
        updateItems,
        selectPayment,
        confirmPayment,
        goToPayment,
        refreshEmployeeBalance,
        setError,
        clearError,
        reset,
      }}
    >
      {children}
    </CustomerFlowContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────

export function useCustomerFlow(): CustomerFlowContextValue {
  const context = useContext(CustomerFlowContext);
  if (!context) {
    throw new Error(
      "useCustomerFlow must be used within a CustomerFlowProvider"
    );
  }
  return context;
}
