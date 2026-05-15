import { NextResponse } from "next/server";
import { isAdminPinValid } from "@/lib/admin-auth";
import { deleteStaffUserByCode, updateStaffUserByCode } from "@/lib/admin-users-db";
import type { AdminRole } from "@/types";

interface RouteParams {
  params: Promise<{ userCode: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userCode } = await params;
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
    const status = body.status;
    const description = (body.description ?? "").trim();

    if (!userCode || !name || !email) {
      return NextResponse.json(
        { ok: false, error: "User ID, name, and email are required." },
        { status: 400 }
      );
    }
    if (role !== "admin" && role !== "cashier") {
      return NextResponse.json(
        { ok: false, error: "Role must be admin or cashier." },
        { status: 400 }
      );
    }
    if (status && !["active", "invited", "suspended"].includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status." },
        { status: 400 }
      );
    }

    const updated = await updateStaffUserByCode(userCode, {
      userCode: body.userCode,
      name,
      description,
      email,
      role,
      shift,
      status: status || "active",
    });
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "User not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: updated });
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
    console.error("admin users PATCH failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userCode } = await params;
    const body = (await request.json()) as { adminPin?: string };

    const pinCheck = isAdminPinValid((body.adminPin || "").trim());
    if (!pinCheck.ok) {
      return NextResponse.json(
        { ok: false, error: pinCheck.error || "Incorrect PIN." },
        { status: 403 }
      );
    }

    if (!userCode) {
      return NextResponse.json(
        { ok: false, error: "User ID is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteStaffUserByCode(userCode);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "User not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    console.error("admin users DELETE failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not delete user." },
      { status: 500 }
    );
  }
}
