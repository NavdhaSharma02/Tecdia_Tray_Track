"use client";

import { CustomerFlowProvider } from "@/hooks/useCustomerFlow";
import Header from "@/components/layout/Header";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerFlowProvider>
      <Header showAdmin={true} />
      <main className="customer-stage">
        <div className="customer-stage__glow customer-stage__glow--top" />
        <div className="customer-stage__glow customer-stage__glow--bottom" />
        <section className="customer-panel">{children}</section>
      </main>
    </CustomerFlowProvider>
  );
}
