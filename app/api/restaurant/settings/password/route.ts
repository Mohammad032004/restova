import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function PATCH(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Only restaurant owner / manager
    // --------------------------------------------------

    const allowedRoles = [
      "RESTAURANT_OWNER",
      "MANAGER",
    ];

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to change the password.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. User must have restaurant
    // --------------------------------------------------

    if (!session.user.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant information is missing.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Read request
    // --------------------------------------------------

    const body = await request.json();

    const currentPassword =
      typeof body?.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body?.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body?.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    // --------------------------------------------------
    // 5. Validation
    // --------------------------------------------------

    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is required.",
        },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password is required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password cannot exceed 128 characters.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New passwords do not match.",
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Connect DB
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 7. Find logged-in user
    // --------------------------------------------------

    const user = await User.findOne({
      _id: session.user.id,
      restaurantId: session.user.restaurantId,
      role: session.user.role,
      isActive: true,
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Account not found or inactive.",
        },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account does not have a password configured.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. Verify current password
    // --------------------------------------------------

    const currentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!currentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Hash new password
    // --------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    // --------------------------------------------------
    // 10. Update password
    // --------------------------------------------------

    user.password = hashedPassword;

    // Any old password setup token should no longer
    // be usable after a password has been created.
    user.passwordSetupToken = undefined;
    user.passwordSetupExpires = undefined;

    await user.save();

    // --------------------------------------------------
    // 11. Success
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Restaurant password change error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while changing your password.",
      },
      { status: 500 }
    );
  }
}