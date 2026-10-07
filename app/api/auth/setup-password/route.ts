import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";
import OwnerInvitation from "@/models/OwnerInvitation";

const STAFF_ROLES = [
  "MANAGER",
  "KITCHEN",
  "WAITER",
  "CASHIER",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    // --------------------------------------------------
    // 1. Basic validation
    // --------------------------------------------------

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Password setup token is required.",
        },
        { status: 400 }
      );
    }

    if (!password) {
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

    // --------------------------------------------------
    // 3. Connect to MongoDB
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 4. Hash token received from URL
    // --------------------------------------------------

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // ==================================================
    // 5. FIRST: CHECK RESTAURANT OWNER INVITATION
    // ==================================================

    const invitation = await OwnerInvitation.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (invitation) {
      // ------------------------------------------------
      // 6. Find owner account
      // ------------------------------------------------

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

      // ------------------------------------------------
      // 7. Verify owner role
      // ------------------------------------------------

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

      // ------------------------------------------------
      // 8. Hash password
      // ------------------------------------------------

      const hashedPassword = await bcrypt.hash(password, 12);

      // ------------------------------------------------
      // 9. Set owner password
      // ------------------------------------------------

      user.password = hashedPassword;

      // Clear old setup-token fields
      user.passwordSetupToken = undefined;
      user.passwordSetupExpires = undefined;

      user.isActive = true;

      await user.save();

      // ------------------------------------------------
      // 10. Mark owner invitation as used
      // ------------------------------------------------

      invitation.usedAt = new Date();

      await invitation.save();

      // ------------------------------------------------
      // 11. Owner success
      // ------------------------------------------------

      return NextResponse.json(
        {
          success: true,
          accountType: "RESTAURANT_OWNER",
          message:
            "Password created successfully. You can now log in.",
        },
        { status: 200 }
      );
    }

    // ==================================================
    // 12. CHECK RESTAURANT STAFF SETUP TOKEN
    // ==================================================

    const staff = await User.findOne({
      passwordSetupToken: tokenHash,
      passwordSetupExpires: {
        $gt: new Date(),
      },
    }).select(
      "+password +passwordSetupToken +passwordSetupExpires"
    );

    // --------------------------------------------------
    // 13. Staff invitation not found / expired
    // --------------------------------------------------

    if (!staff) {
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
    // 14. Verify staff role
    // --------------------------------------------------

    if (!STAFF_ROLES.includes(staff.role as (typeof STAFF_ROLES)[number])) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password setup link is not valid for this account.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 15. Hash staff password
    // --------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // --------------------------------------------------
    // 16. Set staff password
    // --------------------------------------------------

    staff.password = hashedPassword;

    // Clear setup token immediately.
    // This makes the link single-use.
    staff.passwordSetupToken = undefined;
    staff.passwordSetupExpires = undefined;

    staff.isActive = true;

    await staff.save();

    // --------------------------------------------------
    // 17. Staff success
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        accountType: staff.role,
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