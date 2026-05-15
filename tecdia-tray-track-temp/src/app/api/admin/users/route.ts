import { NextResponse } from "next/server";
import { isAdminPinValid } from "@/lib/admin-auth";
import { createStaffUser, listStaffUsers } from "@/lib/admin-users-db";
import type { AdminRole } from "@/types";

export async function GET() {
  try {
    const users = await listStaffUsers();
    return NextResponse.json({ ok: true, data: users });
  } catch (error) {
    console.error("admin users GET failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      adminPin?: string;
      userCode?: string;
      name?: string;
      description?: string;
      email?: string;
      role?: AdminRole;
      shift?: string;
      status?: "active" | "invited" | "suspended";
    };

    const pinCheck = isAdminPinValid((body.adminPin || "").trim());
    if (!pinCheck.ok) {
      return NextResponse.json(
        { ok: false, error: pinCheck.error || "Incorrect PIN." },
        { status: 403 }
      );
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const role = body.role;
    const shift = (body.shift || "").trim();
    const status = body.status || "active";
    const description = (body.description || "").trim();

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required." },
        { status: 400 }
      );
    }
    if (role !== "admin" && role !== "cashier") {
      return NextResponse.json(
        { ok: false, error: "Role must be admin or cashier." },
        { status: 400 }
      );
    }
    if (!["active", "invited", "suspended"].includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status." },
        { status: 400 }
      );
    }

    const user = await createStaffUser({
      userCode: body.userCode,
      name,
      description,
      email,
      role,
      shift,
      status,
    });
    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { ok: false, error: "User ID or email already exists." },
        { status: 409 }
      );
    }
    console.error("admin users POST failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not create user." },
      { status: 500 }
    );
  }
}
