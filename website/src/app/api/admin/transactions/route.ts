import { NextResponse } from "next/server";
import { listTransactionsForAdmin } from "@/lib/admin-transactions-db";

export async function GET() {
  try {
    const transactions = await listTransactionsForAdmin();
    return NextResponse.json({ ok: true, data: transactions });
  } catch (error) {
    console.error("Admin transactions load failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load transactions." },
      { status: 500 }
    );
  }
}
