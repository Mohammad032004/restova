import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { processExpiredSubscriptions } from "@/lib/subscription-renewal";

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "CRON_SECRET is not configured.",
        },
        { status: 500 }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const result = await processExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      message:
        "Subscription processing completed.",
      ...result,
    });
  } catch (error) {
    console.error(
      "Subscription cron error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Subscription processing failed.",
      },
      { status: 500 }
    );
  }
}