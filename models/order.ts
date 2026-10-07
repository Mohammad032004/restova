import mongoose, { Document, Model, Schema } from "mongoose";

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type PaymentMethod =
  | "CASH"
  | "UPI"
  | "CARD"
  | "RAZORPAY"
  | "OTHER";

export type OrderType = "DINE_IN" | "TAKEAWAY";

export type OrderSource = "CUSTOMER_QR" | "WAITER" | "STAFF";

export interface IOrderItem {
  menuItemId?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableId?: mongoose.Types.ObjectId;

  orderNumber: number;

  orderType: OrderType;
  source: OrderSource;

  items: IOrderItem[];

  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  status: OrderStatus;

  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;

  customerName?: string;
  customerPhone?: string;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const OrderSchema = new Schema<IOrder>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      index: true,
    },

    orderNumber: {
      type: Number,
      required: true,
    },

    orderType: {
      type: String,
      enum: ["DINE_IN", "TAKEAWAY"],
      default: "DINE_IN",
      required: true,
    },

    source: {
      type: String,
      enum: ["CUSTOMER_QR", "WAITER", "STAFF"],
      default: "CUSTOMER_QR",
      required: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "An order must contain at least one item.",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "SERVED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PLACED",
      required: true,
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      required: true,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CARD", "RAZORPAY", "OTHER"],
    },

    paymentId: {
      type: String,
      trim: true,
    },

    customerName: {
      type: String,
      trim: true,
    },

    customerPhone: {
      type: String,
      trim: true,
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

/*
 * Order numbers only need to be unique
 * inside a restaurant.
 *
 * Restaurant A:
 *   #1001
 *   #1002
 *
 * Restaurant B:
 *   #1001
 *   #1002
 */
OrderSchema.index(
  { restaurantId: 1, orderNumber: 1 },
  { unique: true }
);

/*
 * Useful for dashboard queries such as:
 * today's orders for one restaurant
 */
OrderSchema.index({
  restaurantId: 1,
  createdAt: -1,
});

/*
 * Useful for kitchen/order status filtering.
 */
OrderSchema.index({
  restaurantId: 1,
  status: 1,
  createdAt: -1,
});

/*
 * Useful for payment/billing queries.
 */
OrderSchema.index({
  restaurantId: 1,
  paymentStatus: 1,
  createdAt: -1,
});

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;