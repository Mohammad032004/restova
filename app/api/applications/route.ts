import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      restaurantName,
      restaurantType,
      numberOfTables,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
    } = body;

    // Basic validation
    if (
      !restaurantName ||
      !restaurantType ||
      !numberOfTables ||
      !ownerName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All required fields must be provided.",
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Check whether an application already exists for this email
    const existingApplication =
      await RestaurantApplication.findOne({
        email: email.toLowerCase().trim(),
        status: "PENDING",
      });

    if (existingApplication) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have a pending application with this email address.",
        },
        { status: 409 }
      );
    }

    // Create application
    const application = await RestaurantApplication.create({
      restaurantName: restaurantName.trim(),
      restaurantType: restaurantType.trim(),
      numberOfTables: Number(numberOfTables),

      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),

      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),

      status: "PENDING",
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your restaurant application has been submitted successfully.",
        applicationId: application._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Restaurant application error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while submitting your application.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const applications = await RestaurantApplication.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load applications.",
      },
      { status: 500 }
    );
  }
}