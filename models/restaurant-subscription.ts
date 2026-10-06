import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "SUSPENDED";

export interface IRestaurantSubscription
  extends Document {
  restaurantId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;

  status: SubscriptionStatus;

  startDate: Date;
  endDate: Date;

  billingCycle: "MONTHLY" | "YEARLY";

  price: number;

  autoRenew: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSubscriptionSchema =
  new Schema<IRestaurantSubscription>(
    {
      restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
        index: true,
      },

      planId: {
        type: Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
        required: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "TRIAL",
          "ACTIVE",
          "EXPIRED",
          "CANCELLED",
          "SUSPENDED",
        ],
        required: true,
        default: "TRIAL",
        index: true,
      },

      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        required: true,
      },

      billingCycle: {
        type: String,
        enum: ["MONTHLY", "YEARLY"],
        required: true,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      autoRenew: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

RestaurantSubscriptionSchema.index(
  { restaurantId: 1, status: 1 }
);

const RestaurantSubscription: Model<IRestaurantSubscription> =
  mongoose.models.RestaurantSubscription ||
  mongoose.model<IRestaurantSubscription>(
    "RestaurantSubscription",
    RestaurantSubscriptionSchema
  );

export default RestaurantSubscription;