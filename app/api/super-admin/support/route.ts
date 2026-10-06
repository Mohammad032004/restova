import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";

function generateTicketNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);

  return `RST-${random}`;
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (
      status &&
      ["open", "in-progress", "resolved", "closed"].includes(status)
    ) {
      filter.status = status;
    }

    if (
      priority &&
      ["low", "medium", "high", "urgent"].includes(priority)
    ) {
      filter.priority = priority;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");

      filter.$or = [
        { ticketNumber: regex },
        { subject: regex },
        { restaurantName: regex },
        { ownerName: regex },
        { ownerEmail: regex },
      ];
    }

    const tickets = await SupportTicket.find(filter)
      .sort({ lastMessageAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("GET support tickets error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load support tickets",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.subject?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject is required",
        },
        { status: 400 }
      );
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Description is required",
        },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.create({
      ticketNumber: generateTicketNumber(),

      subject: body.subject.trim(),

      description: body.description.trim(),

      category: body.category || "other",

      priority: body.priority || "medium",

      status: "open",

      restaurantId: body.restaurantId || null,

      restaurantName: body.restaurantName || "",

      ownerId: body.ownerId || null,

      ownerName: body.ownerName || "",

      ownerEmail: body.ownerEmail || "",

      assignedTo: body.assignedTo || "",

      messages: [
        {
          senderType: body.senderType || "restaurant",

          senderName:
            body.senderName ||
            body.ownerName ||
            "Restaurant",

          senderEmail:
            body.senderEmail ||
            body.ownerEmail ||
            "",

          message: body.description.trim(),
        },
      ],

      lastMessageAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Support ticket created successfully",
        ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST support ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create support ticket",
      },
      { status: 500 }
    );
  }
}