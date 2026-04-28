import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, parseSessionToken } from "@/lib/session";
import { createFeedback } from "@/lib/customer-activity-db";

interface FeedbackBody {
  issueText?: string;
  transactionId?: string | null;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = parseSessionToken(token);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Please log in to submit feedback." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as FeedbackBody;
    const issueText = (body.issueText || "").trim();
    const transactionId = body.transactionId || null;
    if (!issueText) {
      return NextResponse.json(
        { ok: false, error: "Feedback message is required." },
        { status: 400 }
      );
    }

    await createFeedback({
      customerId: session.userId,
      issueText,
      transactionId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback submission failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not submit feedback." },
      { status: 500 }
    );
  }
}
