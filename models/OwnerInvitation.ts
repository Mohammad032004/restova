import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOwnerInvitation extends Document {
  restaurantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  email: string;

  tokenHash: string;

  expiresAt: Date;
  usedAt?: Date | null;

  lastSentAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const OwnerInvitationSchema =
  new Schema<IOwnerInvitation>(
    {
      restaurantId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
      },

      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
      },

      tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      usedAt: {
        type: Date,
        default: null,
      },

      lastSentAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

const OwnerInvitation: Model<IOwnerInvitation> =
  mongoose.models.OwnerInvitation ||
  mongoose.model<IOwnerInvitation>(
    "OwnerInvitation",
    OwnerInvitationSchema
  );

export default OwnerInvitation;