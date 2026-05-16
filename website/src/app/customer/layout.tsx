"use client";

import { CustomerFlowProvider } from "@/hooks/useCustomerFlow";
import CustomerBackgroundSlideshow from "@/components/layout/CustomerBackgroundSlideshow";
import Header from "@/components/layout/Header";
import CustomerCatCompanion from "@/components/layout/CustomerCatCompanion";
import CustomerInteractivePanel from "@/components/layout/CustomerInteractivePanel";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerFlowProvider>
      <Header showAdmin />
      <main className="customer-stage">
        <CustomerCatCompanion />
        <div className="customer-stage__glow customer-stage__glow--top" />
        <div className="customer-stage__glow customer-stage__glow--bottom" />
        <div className="customer-stage__shell">
          <aside className="customer-stage__media" aria-label="Food showcase slideshow">
            <CustomerBackgroundSlideshow />
          </aside>
          <CustomerInteractivePanel>{children}</CustomerInteractivePanel>
        </div>
      </main>
    </CustomerFlowProvider>
  );
}
