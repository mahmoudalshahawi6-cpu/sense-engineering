import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "engineering-digital-libraries",
    time: new Date().toISOString(),
  });
}
