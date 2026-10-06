import { Schema, models, model } from "mongoose";

const SupportMessageSchema = new Schema(
  {
    senderType: {
      type: String,
      enum: ["admin", "restaurant", "owner"],
      required: true,
    },

    senderName: {
      type: String,
      required: true,
      trim: true,
    },

    senderEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const SupportTicketSchema = new Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "billing",
        "technical",
        "account",
        "restaurant",
        "subscription",
        "payment",
        "other",
      ],
      default: "other",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
      index: true,
    },

    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },

    restaurantName: {
      type: String,
      default: "",
      trim: true,
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
    },

    ownerName: {
      type: String,
      default: "",
      trim: true,
    },

    ownerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    assignedTo: {
      type: String,
      default: "",
      trim: true,
    },

    messages: {
      type: [SupportMessageSchema],
      default: [],
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SupportTicket =
  models.SupportTicket ||
  model("SupportTicket", SupportTicketSchema);

export default SupportTicket;