import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { processExpiredSubscriptions } from "@/lib/subscription-renewal";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const result = await processExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      message:
        "Subscription renewal processing completed.",
      ...result,
    });
  } catch (error) {
    console.error(
      "Process subscription renewals error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to process subscription renewals.",
      },
      { status: 500 }
    );
  }
}