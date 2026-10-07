import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMenuCategory extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuCategorySchema = new Schema<IMenuCategory>(
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

    description: {
      type: String,
      trim: true,
      default: "",
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// A restaurant cannot have two categories with the same name.
MenuCategorySchema.index(
  { restaurantId: 1, name: 1 },
  { unique: true }
);

// Useful for displaying categories in menu order.
MenuCategorySchema.index({
  restaurantId: 1,
  sortOrder: 1,
  createdAt: 1,
});

const MenuCategory: Model<IMenuCategory> =
  mongoose.models.MenuCategory ||
  mongoose.model<IMenuCategory>(
    "MenuCategory",
    MenuCategorySchema
  );

export default MenuCategory;