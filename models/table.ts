import mongoose, { Document, Model, Schema } from "mongoose";

export type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "BILL_REQUESTED"
  | "CLEANING";

export interface ITable extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
  qrToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    number: {
      type: Number,
      required: true,
      min: 1,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "OCCUPIED",
        "BILL_REQUESTED",
        "CLEANING",
      ],
      default: "AVAILABLE",
      index: true,
    },

    qrToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TableSchema.index(
  { restaurantId: 1, number: 1 },
  { unique: true }
);

const Table: Model<ITable> =
  mongoose.models.Table ||
  mongoose.model<ITable>("Table", TableSchema);

export default Table;