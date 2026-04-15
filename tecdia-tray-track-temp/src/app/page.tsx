import { redirect } from "next/navigation";

/**
 * Root page — redirects to the customer kiosk interface.
 */
export default function RootPage() {
  redirect("/customer");
}
