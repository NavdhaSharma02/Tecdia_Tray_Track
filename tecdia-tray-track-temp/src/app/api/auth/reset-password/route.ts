import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { isAdminPinValid } from "@/lib/admin-auth";
import { findCustomerByEmail, updateCustomerPassword } from "@/lib/customer-auth";

interface ResetPasswordBody {
  email?: string;
  adminPin?: string;
  newPassword?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordBody;
    const email = normalizeEmail(body.email || "");
    const adminPin = (body.adminPin || "").trim();
    const newPassword = body.newPassword || "";

    if (!email || !adminPin || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "Email, admin PIN, and new password are required." },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const pinCheck = isAdminPinValid(adminPin);
    if (!pinCheck.ok) {
      const status = pinCheck.error === "Admin login is not configured." ? 503 : 401;
      return NextResponse.json(
        { ok: false, error: pinCheck.error || "Invalid PIN." },
        { status }
      );
    }

    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: "No account found for this email." },
        { status: 404 }
      );
    }

    const passwordData = hashPassword(newPassword);
    await updateCustomerPassword({
      customerId: customer.id,
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset password failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not reset password." },
      { status: 500 }
    );
  }
}
