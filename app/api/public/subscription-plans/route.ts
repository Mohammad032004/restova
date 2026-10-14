
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import SubscriptionPlan from "@/models/subscription-plan";

export async function GET() {
  try {
    await connectDB();

    const plans = await SubscriptionPlan.find({
      isActive: true,
    })
      .select(
        "name description price billingCycle features maxTables maxStaff"
      )
      .sort({ price: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        plans,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Public subscription plans error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load subscription plans.",
      },
      { status: 500 }
    );
  }
}
