import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import SubscriptionInvoice from "@/models/subscription-invoice";

type AuthResult =
  | {
      authorized: true;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

async function requireSuperAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Forbidden. Super Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
  };
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice ID is required.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const invoice = await SubscriptionInvoice.findById(id);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found.",
        },
        { status: 404 }
      );
    }

    if (invoice.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "Only pending invoices can be paid.",
        },
        { status: 400 }
      );
    }

    /*
     * Razorpay integration will be added in the next step.
     *
     * For now, we return the information required
     * to create the Razorpay order.
     */
    return NextResponse.json({
      success: true,
      message: "Invoice is ready for payment.",
      invoice: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        restaurantId: invoice.restaurantId.toString(),
        subscriptionId: invoice.subscriptionId.toString(),
      },
    });
  } catch (error) {
    console.error(
      "Prepare subscription invoice payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to prepare invoice payment.",
      },
      { status: 500 }
    );
  }
}