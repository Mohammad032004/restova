import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import OwnerInvitation from "@/models/OwnerInvitation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { token, password } = body;

    // --------------------------------------------------
    // 1. Basic validation
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 2. Password security requirements
    // --------------------------------------------------

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password cannot exceed 128 characters.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Connect to MongoDB
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 4. Hash the token received from the URL
    // --------------------------------------------------

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // --------------------------------------------------
    // 5. Find active invitation
    // --------------------------------------------------

    const invitation = await OwnerInvitation.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password setup link is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Find owner
    // --------------------------------------------------

    const user = await User.findById(invitation.userId).select(
      "+password"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The account associated with this invitation could not be found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 7. Make sure this is a restaurant owner
    // --------------------------------------------------

    if (user.role !== "RESTAURANT_OWNER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This invitation is not valid for a restaurant owner account.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. Hash password
    // --------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // --------------------------------------------------
    // 9. Set password
    // --------------------------------------------------

    user.password = hashedPassword;

    // Keep the old fields cleared in case an older
    // invitation existed for this user.
    user.passwordSetupToken = undefined;
    user.passwordSetupExpires = undefined;

    user.isActive = true;

    await user.save();

    // --------------------------------------------------
    // 10. Mark invitation as used
    // --------------------------------------------------

    invitation.usedAt = new Date();

    await invitation.save();

    // --------------------------------------------------
    // 11. Success
    // --------------------------------------------------

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
        message:
          "Something went wrong while setting up your password.",
      },
      { status: 500 }
    );
  }
}