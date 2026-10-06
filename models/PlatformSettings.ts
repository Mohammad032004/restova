import { Schema, models, model } from "mongoose";

const PlatformSettingsSchema = new Schema(
  {
    platformName: {
      type: String,
      default: "Restova",
      trim: true,
    },

    supportEmail: {
      type: String,
      default: "support@restova.com",
      trim: true,
      lowercase: true,
    },

    adminEmail: {
      type: String,
      default: "admin@restova.com",
      trim: true,
      lowercase: true,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    currency: {
      type: String,
      default: "INR",
    },

    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      payments: {
        type: Boolean,
        default: true,
      },
      newRestaurants: {
        type: Boolean,
        default: true,
      },
      support: {
        type: Boolean,
        default: true,
      },
    },

    security: {
      twoFactor: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const PlatformSettings =
  models.PlatformSettings ||
  model("PlatformSettings", PlatformSettingsSchema);

export default PlatformSettings;