import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { token, password } = body;

    // Basic validation
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Password setup token is required.",
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required.",
        },
        { status: 400 }
      );
    }

    // Password security requirements
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message: "Password cannot exceed 128 characters.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with an active setup token
    const user = await User.findOne({
      passwordSetupToken: token,
      passwordSetupExpires: {
        $gt: new Date(),
      },
    }).select(
      "+passwordSetupToken +passwordSetupExpires +password"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "This password setup link is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Set password
    user.password = hashedPassword;

    // Invalidate setup token immediately
    user.passwordSetupToken = undefined;
    user.passwordSetupExpires = undefined;

    user.isActive = true;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message:
          "Password created successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password setup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while setting up your password.",
      },
      { status: 500 }
    );
  }
}