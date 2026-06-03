import { NextResponse } from "next/server";
import { syncLiveMatches, lockUpcomingMatches } from "@/services/football-api";

// This endpoint is called by Vercel Cron — defined in vercel.json
// During match days: every 5 minutes
// Off days: every hour

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Lock predictions for matches starting soon
    await lockUpcomingMatches();

    // Sync live/recently-finished matches
    const result = await syncLiveMatches();

    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
