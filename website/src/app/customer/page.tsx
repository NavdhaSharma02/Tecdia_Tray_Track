"use client";

import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import IdleScreenEditorial from "@/components/customer/IdleScreenEditorial";
import EmailAuthScreen from "@/components/customer/EmailAuthScreen";

import TrayScanView from "@/components/customer/TrayScanView";
import FoodResults from "@/components/customer/FoodResults";
import ManualBillingView from "@/components/customer/ManualBillingView";
import PaymentScreen from "@/components/customer/PaymentScreen";
import DoneScreen from "@/components/customer/DoneScreen";

/**
 * Customer flow page — single-page state machine that renders
 * the appropriate step component based on flow state.
 */
export default function CustomerPage() {
  const { step, billingMode } = useCustomerFlow();
  const isScrollLocked = step === "IDLE" || step === "SCANNING";

  return (
    <div className="customer-page">
      {/* Step content */}
      <div
        className={`customer-page__content page-enter${isScrollLocked ? " customer-page__content--locked" : ""}`}
        key={step}
      >
        {step === "IDLE" && <IdleScreenEditorial />}
        {step === "EMAIL_AUTH" && <EmailAuthScreen />}

        {step === "SCANNING" && <TrayScanView />}
        {step === "BILL" && billingMode === "manual" && <ManualBillingView />}
        {step === "BILL" && billingMode !== "manual" && <FoodResults />}
        {step === "PAYMENT" && <PaymentScreen />}
        {step === "DONE" && <DoneScreen />}
      </div>
    </div>
  );
}
