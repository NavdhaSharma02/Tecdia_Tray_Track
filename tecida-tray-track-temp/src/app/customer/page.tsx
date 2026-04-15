"use client";

import { useCustomerFlow } from "@/hooks/useCustomerFlow";
import FlowStepper from "@/components/layout/FlowStepper";
import IdleScreen from "@/components/customer/IdleScreen";

import TrayScanView from "@/components/customer/TrayScanView";
import FoodResults from "@/components/customer/FoodResults";
import PaymentScreen from "@/components/customer/PaymentScreen";
import DoneScreen from "@/components/customer/DoneScreen";

/**
 * Customer flow page — single-page state machine that renders
 * the appropriate step component based on flow state.
 */
export default function CustomerPage() {
  const { step } = useCustomerFlow();

  return (
    <div className="customer-page">
      {/* Step indicator */}
      <FlowStepper currentStep={step} />

      {/* Step content */}
      <div className="customer-page__content page-enter" key={step}>
        {step === "IDLE" && <IdleScreen />}

        {step === "SCANNING" && <TrayScanView />}
        {step === "RESULTS" && <FoodResults />}
        {step === "PAYMENT" && <PaymentScreen />}
        {step === "DONE" && <DoneScreen />}
      </div>
    </div>
  );
}
