import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  description?: string;

  price: number;
  billingCycle: "MONTHLY" | "YEARLY";

  features: string[];

  maxTables: number;
  maxStaff: number;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema =
  new Schema<ISubscriptionPlan>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        trim: true,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      billingCycle: {
        type: String,
        enum: ["MONTHLY", "YEARLY"],
        required: true,
      },

      features: {
        type: [String],
        default: [],
      },

      maxTables: {
        type: Number,
        required: true,
        min: 1,
      },

      maxStaff: {
        type: Number,
        required: true,
        min: 1,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>(
    "SubscriptionPlan",
    SubscriptionPlanSchema
  );

export default SubscriptionPlan;