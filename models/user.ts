import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole =
  | "SUPER_ADMIN"
  | "RESTAURANT_OWNER"
  | "MANAGER"
  | "KITCHEN"
  | "WAITER"
  | "CASHIER";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;

  password?: string;

  role: UserRole;

  restaurantId?: mongoose.Types.ObjectId;

  isActive: boolean;

  passwordSetupToken?: string;
  passwordSetupExpires?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "RESTAURANT_OWNER",
        "MANAGER",
        "KITCHEN",
        "WAITER",
        "CASHIER",
      ],
      required: true,
    },

    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    passwordSetupToken: {
      type: String,
      select: false,
    },

    passwordSetupExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;