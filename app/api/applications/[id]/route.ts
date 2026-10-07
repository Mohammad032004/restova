import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";
import Restaurant from "@/models/restaurant";
import User from "@/models/user";
import OwnerInvitation from "@/models/OwnerInvitation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Super Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Application ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await RestaurantApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        { message: "Application not found." },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          message: `Application has already been ${application.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    application.status = "REJECTED";
    await application.save();

    return NextResponse.json(
      {
        success: true,
        message: "Application rejected successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject application error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to reject application.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Application ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await RestaurantApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        { message: "Application not found." },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * PENDING / REJECTED APPLICATION
     * ---------------------------------------------------------
     *
     * These applications don't have a restaurant/owner created
     * by the approval process, so we only delete the application.
     */

    if (
      application.status === "PENDING" ||
      application.status === "REJECTED"
    ) {
      await RestaurantApplication.findByIdAndDelete(id);

      return NextResponse.json(
        {
          success: true,
          message: "Application deleted successfully.",
        },
        { status: 200 }
      );
    }

    /*
     * ---------------------------------------------------------
     * APPROVED APPLICATION
     * ---------------------------------------------------------
     *
     * Approval creates:
     *
     * Application
     *      ↓ email
     * User (RESTAURANT_OWNER)
     *      ↓ restaurantId
     * Restaurant
     *
     * OwnerInvitation also contains:
     * - userId
     * - restaurantId
     *
     * Therefore we remove all three related records.
     */

    if (application.status === "APPROVED") {
      const owner = await User.findOne({
        email: application.email,
        role: "RESTAURANT_OWNER",
      });

      /*
       * If the owner account cannot be found, don't silently
       * delete the application because that could leave the
       * relationship in an unknown state.
       */
      if (!owner) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The restaurant owner account associated with this approved application could not be found. Deletion was stopped to protect related data.",
          },
          { status: 409 }
        );
      }

      /*
       * The approval process stores restaurantId on the owner.
       */
      if (!owner.restaurantId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The owner account is not linked to a restaurant. Deletion was stopped to protect related data.",
          },
          { status: 409 }
        );
      }

      /*
       * Find the restaurant using the direct relationship.
       */
      const restaurant = await Restaurant.findOne({
        _id: owner.restaurantId,
        ownerId: owner._id,
      });

      if (!restaurant) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The restaurant associated with this owner account could not be found. Deletion was stopped to protect related data.",
          },
          { status: 409 }
        );
      }

      /*
       * Delete the invitation associated with this owner
       * and restaurant.
       */
      await OwnerInvitation.deleteMany({
        userId: owner._id,
        restaurantId: restaurant._id,
      });

      /*
       * Delete restaurant first.
       */
      await Restaurant.deleteOne({
        _id: restaurant._id,
        ownerId: owner._id,
      });

      /*
       * Delete owner account.
       */
      await User.deleteOne({
        _id: owner._id,
        role: "RESTAURANT_OWNER",
        restaurantId: restaurant._id,
      });

      /*
       * Finally delete the application.
       */
      await RestaurantApplication.deleteOne({
        _id: application._id,
      });

      return NextResponse.json(
        {
          success: true,
          message:
            "Approved application and its related restaurant, owner account, and invitation were deleted successfully.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unsupported application status.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Delete application error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete application and related data.",
      },
      { status: 500 }
    );
  }
}