import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRestaurantApplication extends Document {
  restaurantName: string;
  restaurantType: string;
  numberOfTables: number;

  ownerName: string;
  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  pincode: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  createdAt: Date;
  updatedAt: Date;
}

const RestaurantApplicationSchema =
  new Schema<IRestaurantApplication>(
    {
      restaurantName: {
        type: String,
        required: true,
        trim: true,
      },

      restaurantType: {
        type: String,
        required: true,
        trim: true,
      },

      numberOfTables: {
        type: Number,
        required: true,
        min: 1,
      },

      ownerName: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },

      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },
    },
    {
      timestamps: true,
    }
  );

const RestaurantApplication: Model<IRestaurantApplication> =
  mongoose.models.RestaurantApplication ||
  mongoose.model<IRestaurantApplication>(
    "RestaurantApplication",
    RestaurantApplicationSchema
  );

export default RestaurantApplication;