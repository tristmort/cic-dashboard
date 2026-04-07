import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_KEY = "business-metrics.json";

interface BusinessMetrics {
  appointments: number;
  closed: number;
  avgDealValue: number;
  updatedAt: string;
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length === 0) {
      return NextResponse.json({ appointments: 0, closed: 0, avgDealValue: 0 });
    }
    const res = await fetch(blobs[0].url);
    const data: BusinessMetrics = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to read business metrics:", error);
    return NextResponse.json({ appointments: 0, closed: 0, avgDealValue: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const metrics: BusinessMetrics = {
      appointments: Number(body.appointments) || 0,
      closed: Number(body.closed) || 0,
      avgDealValue: Number(body.avgDealValue) || 0,
      updatedAt: new Date().toISOString(),
    };

    await put(BLOB_KEY, JSON.stringify(metrics), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to save business metrics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save" },
      { status: 500 }
    );
  }
}
