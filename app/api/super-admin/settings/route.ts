import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PlatformSettings from "@/models/PlatformSettings";

export async function GET() {
  try {
    await connectDB();

    let settings = await PlatformSettings.findOne().lean();

    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET /api/super-admin/settings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load settings",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const settings = await PlatformSettings.findOneAndUpdate(
      {},
      {
        $set: {
          platformName: body.platformName,
          supportEmail: body.supportEmail,
          adminEmail: body.adminEmail,
          timezone: body.timezone,
          currency: body.currency,
          notifications: body.notifications,
          security: body.security,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("PUT /api/super-admin/settings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save settings",
      },
      { status: 500 }
    );
  }
}