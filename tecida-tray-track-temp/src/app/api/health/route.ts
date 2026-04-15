import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health check endpoint to verify the API is running.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
