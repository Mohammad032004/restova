import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import mongoose from "mongoose";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurant";
import User, { IUser } from "@/models/user";

const ALLOWED_ROLES = [
  "RESTAURANT_OWNER",
  "MANAGER",
];

const MANAGEABLE_ROLES = [
  "MANAGER",
  "KITCHEN",
  "WAITER",
  "CASHIER",
] as const;

type ManageableRole =
  (typeof MANAGEABLE_ROLES)[number];

/*
|--------------------------------------------------------------------------
| AUTHORIZATION
|--------------------------------------------------------------------------
*/

async function getAuthorizedRestaurant() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      ),
    };
  }

  if (
    !ALLOWED_ROLES.includes(
      session.user.role
    )
  ) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage staff.",
        },
        { status: 403 }
      ),
    };
  }

  if (!session.user.restaurantId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message:
            "Restaurant information is missing.",
        },
        { status: 400 }
      ),
    };
  }

  await connectDB();

  /*
  |--------------------------------------------------------------------------
  | Verify restaurant
  |--------------------------------------------------------------------------
  */

  const restaurant =
    await Restaurant.findOne({
      _id: session.user.restaurantId,
      status: "ACTIVE",
    }).lean();

  if (!restaurant) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message:
            "Restaurant not found or inactive.",
        },
        { status: 404 }
      ),
    };
  }

  return {
    restaurantId:
      restaurant._id as mongoose.Types.ObjectId,
    sessionUserId: session.user.id,
    sessionUserRole: session.user.role,
  };
}

/*
|--------------------------------------------------------------------------
| FIND STAFF
|--------------------------------------------------------------------------
*/

async function getStaff(
  staffId: string,
  restaurantId: mongoose.Types.ObjectId
): Promise<IUser | null> {
  const staff = await User.findOne({
    _id: staffId,
    restaurantId: restaurantId,
    role: {
      $in: MANAGEABLE_ROLES,
    },
  }).select(
    "+passwordSetupToken +passwordSetupExpires"
  );

  return staff;
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
|
| Supported actions:
|
| UPDATE
| STATUS
| REGENERATE_SETUP_LINK
|
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    */

    const result =
      await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    /*
    |--------------------------------------------------------------------------
    | Get staff ID
    |--------------------------------------------------------------------------
    */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Staff ID is required.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Request body
    |--------------------------------------------------------------------------
    */

    const body = await request.json();

    const action =
      typeof body?.action === "string"
        ? body.action
            .toUpperCase()
            .trim()
        : "";

    /*
    |--------------------------------------------------------------------------
    | Find staff
    |--------------------------------------------------------------------------
    */

    const staff = await getStaff(
      id,
      result.restaurantId
    );

    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Staff member not found.",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent self-management
    |--------------------------------------------------------------------------
    */

    if (
      staff._id.toString() ===
      result.sessionUserId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot manage your own account from staff management.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Manager cannot manage another Manager
    |--------------------------------------------------------------------------
    */

    if (
      result.sessionUserRole ===
        "MANAGER" &&
      staff.role === "MANAGER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Managers cannot manage another manager.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STAFF
    |--------------------------------------------------------------------------
    */

    if (action === "UPDATE") {
      let name: string | undefined;

      let email: string | undefined;

      let phone: string | undefined;

      let role:
        | ManageableRole
        | undefined;

      /*
      |--------------------------------------------------------------------------
      | Name
      |--------------------------------------------------------------------------
      */

      if (body.name !== undefined) {
        if (
          typeof body.name !== "string"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid staff name.",
            },
            { status: 400 }
          );
        }

        const normalizedName =
          body.name.trim();

        if (!normalizedName) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Staff name cannot be empty.",
            },
            { status: 400 }
          );
        }

        if (
          normalizedName.length < 2
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Staff name must contain at least 2 characters.",
            },
            { status: 400 }
          );
        }

        name = normalizedName;
      }

      /*
      |--------------------------------------------------------------------------
      | Email
      |--------------------------------------------------------------------------
      */

      if (body.email !== undefined) {
        if (
          typeof body.email !== "string"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid email address.",
            },
            { status: 400 }
          );
        }

        const normalizedEmail =
          body.email
            .toLowerCase()
            .trim();

        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        /*
        |--------------------------------------------------------------------------
        | Validate normalizedEmail
        |--------------------------------------------------------------------------
        */

        if (
          !emailRegex.test(
            normalizedEmail
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Please enter a valid email address.",
            },
            { status: 400 }
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Check duplicate email
        |--------------------------------------------------------------------------
        */

        const existingUser =
          await User.findOne({
            email: normalizedEmail,
            _id: {
              $ne: staff._id,
            },
          });

        if (existingUser) {
          return NextResponse.json(
            {
              success: false,
              message:
                "A user with this email already exists.",
            },
            { status: 409 }
          );
        }

        email = normalizedEmail;
      }

      /*
      |--------------------------------------------------------------------------
      | Phone
      |--------------------------------------------------------------------------
      */

      if (body.phone !== undefined) {
        if (
          typeof body.phone !== "string"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid phone number.",
            },
            { status: 400 }
          );
        }

        phone =
          body.phone.trim();
      }

      /*
      |--------------------------------------------------------------------------
      | Role
      |--------------------------------------------------------------------------
      */

      if (body.role !== undefined) {
        if (
          typeof body.role !== "string"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid staff role.",
            },
            { status: 400 }
          );
        }

        const requestedRole =
          body.role
            .toUpperCase()
            .trim();

        /*
        |--------------------------------------------------------------------------
        | Validate role
        |--------------------------------------------------------------------------
        */

        if (
          !MANAGEABLE_ROLES.includes(
            requestedRole as ManageableRole
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid staff role. Allowed roles are Manager, Kitchen, Waiter and Cashier.",
            },
            { status: 400 }
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Manager cannot assign Manager
        |--------------------------------------------------------------------------
        */

        if (
          result.sessionUserRole ===
            "MANAGER" &&
          requestedRole === "MANAGER"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Managers cannot assign the Manager role.",
            },
            { status: 403 }
          );
        }

        role =
          requestedRole as ManageableRole;
      }

      /*
      |--------------------------------------------------------------------------
      | Apply updates
      |--------------------------------------------------------------------------
      */

      if (name !== undefined) {
        staff.name = name;
      }

      if (email !== undefined) {
        staff.email = email;
      }

      if (phone !== undefined) {
        staff.phone =
          phone || undefined;
      }

      if (role !== undefined) {
        staff.role = role;
      }

      await staff.save();

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return NextResponse.json(
        {
          success: true,
          message:
            "Staff member updated successfully.",
          staff: {
            id: staff._id.toString(),
            name: staff.name,
            email: staff.email,
            phone: staff.phone || "",
            role: staff.role,
            isActive: staff.isActive,
            createdAt:
              staff.createdAt,
            updatedAt:
              staff.updatedAt,
          },
        },
        { status: 200 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    if (action === "STATUS") {
      if (
        typeof body.isActive !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "isActive must be true or false.",
          },
          { status: 400 }
        );
      }

      staff.isActive =
        body.isActive;

      await staff.save();

      return NextResponse.json(
        {
          success: true,
          message: body.isActive
            ? "Staff member activated successfully."
            : "Staff member deactivated successfully.",
          staff: {
            id: staff._id.toString(),
            name: staff.name,
            email: staff.email,
            role: staff.role,
            isActive:
              staff.isActive,
          },
        },
        { status: 200 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REGENERATE PASSWORD SETUP LINK
    |--------------------------------------------------------------------------
    */

    if (
      action ===
      "REGENERATE_SETUP_LINK"
    ) {
      /*
      |--------------------------------------------------------------------------
      | Account must be active
      |--------------------------------------------------------------------------
      */

      if (!staff.isActive) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Activate the staff account before generating a setup link.",
          },
          { status: 400 }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Generate secure token
      |--------------------------------------------------------------------------
      */

      const rawToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      const hashedToken =
        crypto
          .createHash("sha256")
          .update(rawToken)
          .digest("hex");

      /*
      |--------------------------------------------------------------------------
      | Token expires after 24 hours
      |--------------------------------------------------------------------------
      */

      const passwordSetupExpires =
        new Date(
          Date.now() +
            24 *
              60 *
              60 *
              1000
        );

      staff.passwordSetupToken =
        hashedToken;

      staff.passwordSetupExpires =
        passwordSetupExpires;

      await staff.save();

      /*
      |--------------------------------------------------------------------------
      | Generate setup URL
      |--------------------------------------------------------------------------
      */

      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";

      const setupUrl =
        `${baseUrl}/auth/setup-password?token=${rawToken}`;

      return NextResponse.json(
        {
          success: true,
          message:
            "New password setup link generated successfully.",
          setupUrl,
          setupExpiresAt:
            passwordSetupExpires,
        },
        { status: 200 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Invalid action
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid staff management action.",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error(
      "Restaurant staff PATCH error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | Duplicate email
    |--------------------------------------------------------------------------
    */

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number })
        .code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update staff member.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    */

    const result =
      await getAuthorizedRestaurant();

    if (result.error) {
      return result.error;
    }

    /*
    |--------------------------------------------------------------------------
    | Staff ID
    |--------------------------------------------------------------------------
    */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Staff ID is required.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find staff
    |--------------------------------------------------------------------------
    */

    const staff = await getStaff(
      id,
      result.restaurantId
    );

    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Staff member not found.",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent deleting yourself
    |--------------------------------------------------------------------------
    */

    if (
      staff._id.toString() ===
      result.sessionUserId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot delete your own account.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Manager cannot delete Manager
    |--------------------------------------------------------------------------
    */

    if (
      result.sessionUserRole ===
        "MANAGER" &&
      staff.role === "MANAGER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Managers cannot delete another manager.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete only from current restaurant
    |--------------------------------------------------------------------------
    */

    await User.deleteOne({
      _id: staff._id,
      restaurantId:
        result.restaurantId,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Staff member deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      "Restaurant staff DELETE error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete staff member.",
      },
      { status: 500 }
    );
  }
}