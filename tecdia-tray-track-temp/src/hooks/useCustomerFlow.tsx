"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type {
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
  paymentMethod: null,
  receipt: null,
  error: null,
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
    case "START_SCAN":
      return { ...state, step: "SCANNING", error: null };
    case "SCAN_COMPLETE":
      return {
        ...state,
        step: "RESULTS",
        scannedItems: action.payload,
        isLoading: false,
        error: null,
      };
    case "UPDATE_ITEMS":
      return { ...state, scannedItems: action.payload };
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
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────

interface CustomerFlowContextValue extends CustomerFlowState {
  identifyEmployee: (id: string) => Promise<void>;
  startScan: () => void;
  completeScan: (items: ScannedItem[]) => void;
  updateItems: (items: ScannedItem[]) => void;
  selectPayment: (method: PaymentMethod) => void;
  confirmPayment: () => Promise<void>;
  goToPayment: () => void;
  setError: (msg: string) => void;
  clearError: () => void;
  reset: () => void;
}

const CustomerFlowContext = createContext<CustomerFlowContextValue | null>(null);

// ── Provider ───────────────────────────────────

export function CustomerFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(flowReducer, initialState);

  /**
   * Look up employee by ID, fetch their transactions, and move to PROFILE step.
   */
  const identifyEmployee = useCallback(async (id: string) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const empResult = await api.getEmployee(id);
      if (!empResult.ok || !empResult.data) {
        dispatch({
          type: "SET_ERROR",
          payload: empResult.error || "Employee not found",
        });
        return;
      }

      const txnResult = await api.getEmployeeTransactions(id);
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
        payload: "Failed to fetch employee details. Please try again.",
      });
    }
  }, []);

  const startScan = useCallback(() => {
    dispatch({ type: "START_SCAN" });
  }, []);

  const completeScan = useCallback((items: ScannedItem[]) => {
    dispatch({ type: "SCAN_COMPLETE", payload: items });
  }, []);

  const updateItems = useCallback((items: ScannedItem[]) => {
    dispatch({ type: "UPDATE_ITEMS", payload: items });
  }, []);

  const selectPayment = useCallback((method: PaymentMethod) => {
    dispatch({ type: "SELECT_PAYMENT", payload: method });
  }, []);

  const goToPayment = useCallback(() => {
    // Move from RESULTS → PAYMENT step explicitly
    dispatch({ type: "SET_LOADING", payload: false });
    // We use a small trick: just move the step forward
    dispatch({ type: "SELECT_PAYMENT", payload: state.paymentMethod || "immediate" });
  }, [state.paymentMethod]);

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

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <CustomerFlowContext.Provider
      value={{
        ...state,
        identifyEmployee,
        startScan,
        completeScan,
        updateItems,
        selectPayment,
        confirmPayment,
        goToPayment,
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
