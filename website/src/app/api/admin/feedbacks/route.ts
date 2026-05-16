import { NextResponse } from "next/server";
import { listAllFeedbacks } from "@/lib/customer-activity-db";

export async function GET() {
  try {
    const feedbacks = await listAllFeedbacks();
    return NextResponse.json({ ok: true, data: feedbacks });
  } catch (error) {
    console.error("Admin feedback list failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load feedbacks." },
      { status: 500 }
    );
  }
}
