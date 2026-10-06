import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { ticketId } = await context.params;
    const body = await request.json();

    const allowedStatuses = [
      "open",
      "in-progress",
      "resolved",
      "closed",
    ];

    const allowedPriorities = [
      "low",
      "medium",
      "high",
      "urgent",
    ];

    const update: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid ticket status",
          },
          { status: 400 }
        );
      }

      update.status = body.status;

      if (
        body.status === "resolved" ||
        body.status === "closed"
      ) {
        update.resolvedAt = new Date();
      } else {
        update.resolvedAt = null;
      }
    }

    if (body.priority !== undefined) {
      if (!allowedPriorities.includes(body.priority)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid ticket priority",
          },
          { status: 400 }
        );
      }

      update.priority = body.priority;
    }

    if (body.assignedTo !== undefined) {
      update.assignedTo = String(body.assignedTo).trim();
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid fields to update",
        },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      {
        $set: update,
      },
      {
        new: true,
      }
    ).lean();

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Support ticket not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "PATCH /api/super-admin/support/[ticketId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update support ticket",
      },
      { status: 500 }
    );
  }
}