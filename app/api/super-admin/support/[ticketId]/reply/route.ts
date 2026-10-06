import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    await connectDB();

    const { ticketId } = await context.params;
    const body = await request.json();

    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Reply message is required",
        },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findById(
      ticketId
    );

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Support ticket not found",
        },
        { status: 404 }
      );
    }

    ticket.messages.push({
      senderType: "admin",
      senderName:
        String(body.senderName || "Super Admin").trim(),
      senderEmail:
        String(body.senderEmail || "admin@restova.com")
          .trim()
          .toLowerCase(),
      message,
    });

    ticket.lastMessageAt = new Date();

    // Automatically move an open ticket to in-progress
    // when the admin replies.
    if (ticket.status === "open") {
      ticket.status = "in-progress";
    }

    await ticket.save();

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "POST /api/super-admin/support/[ticketId]/reply error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send reply",
      },
      { status: 500 }
    );
  }
}