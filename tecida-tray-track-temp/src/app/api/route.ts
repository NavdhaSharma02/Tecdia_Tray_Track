import { NextResponse } from "next/server";

/**
 * GET /api
 * Root API endpoint — returns available routes and API info.
 */
export async function GET() {
  return NextResponse.json({
    name: "Tecida Tray Track API",
    version: "0.1.0",
    endpoints: {
      health: "/api/health",
    },
  });
}

/**
 * POST /api
 * Example POST handler — replace with your own logic.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(
      { message: "Data received", data: body },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
