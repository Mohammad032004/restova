import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import RestaurantApplication from "@/models/restaurant-application";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    // 2. Authorization
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden. Super Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // 3. Application ID
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Application ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // 4. Database
    await connectDB();

    // 5. Find application
    const application = await RestaurantApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        {
          message: "Application not found.",
        },
        {
          status: 404,
        }
      );
    }

    // 6. Only pending applications can be rejected
    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          message: `Application has already been ${application.status.toLowerCase()}.`,
        },
        {
          status: 400,
        }
      );
    }

    // 7. Reject application
    application.status = "REJECTED";

    await application.save();

    return NextResponse.json(
      {
        success: true,
        message: "Application rejected successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Reject application error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to reject application.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    // 2. Authorization
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden. Super Admin access required.",
        },
        {
          status: 403,
        }
      );
    }

    // 3. Application ID
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Application ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // 4. Database
    await connectDB();

    // 5. Find application
    const application = await RestaurantApplication.findById(id);

    if (!application) {
      return NextResponse.json(
        {
          message: "Application not found.",
        },
        {
          status: 404,
        }
      );
    }

    // 6. Approved applications are protected
    if (application.status === "APPROVED") {
      return NextResponse.json(
        {
          message:
            "Approved applications cannot be deleted because the restaurant and owner account have already been created.",
        },
        {
          status: 400,
        }
      );
    }

    // 7. Delete pending/rejected application
    await RestaurantApplication.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Application deleted successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Delete application error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete application.",
      },
      {
        status: 500,
      }
    );
  }
}