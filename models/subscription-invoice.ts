import mongoose, { Document, Model, Schema } from "mongoose";

export type SubscriptionInvoiceStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentGateway =
  | "RAZORPAY"
  | "DEMO"
  | "OTHER";

export interface ISubscriptionInvoice extends Document {
  restaurantId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;

  invoiceNumber: string;

  amount: number;
  currency: string;

  status: SubscriptionInvoiceStatus;

  issueDate: Date;
  dueDate?: Date;
  paidAt?: Date;

  paymentGateway?: PaymentGateway;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionInvoiceSchema =
  new Schema<ISubscriptionInvoice>(
    {
      restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
        index: true,
      },

      subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: "RestaurantSubscription",
        required: true,
        index: true,
      },

      invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        required: true,
        default: "INR",
        uppercase: true,
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "PAID",
          "FAILED",
          "REFUNDED",
          "CANCELLED",
        ],
        required: true,
        default: "PENDING",
        index: true,
      },

      issueDate: {
        type: Date,
        required: true,
        default: Date.now,
      },

      dueDate: {
        type: Date,
      },

      paidAt: {
        type: Date,
      },

      paymentGateway: {
        type: String,
        enum: ["RAZORPAY", "DEMO", "OTHER"],
      },

      gatewayOrderId: {
        type: String,
        trim: true,
        index: true,
      },

      gatewayPaymentId: {
        type: String,
        trim: true,
        index: true,
      },

      notes: {
        type: String,
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

SubscriptionInvoiceSchema.index({
  restaurantId: 1,
  status: 1,
});

SubscriptionInvoiceSchema.index({
  subscriptionId: 1,
  createdAt: -1,
});

const SubscriptionInvoice: Model<ISubscriptionInvoice> =
  mongoose.models.SubscriptionInvoice ||
  mongoose.model<ISubscriptionInvoice>(
    "SubscriptionInvoice",
    SubscriptionInvoiceSchema
  );

export default SubscriptionInvoice;