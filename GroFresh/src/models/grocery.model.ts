import mongoose from "mongoose";
import {
  CATEGORY_SUBCATEGORIES,
  GROCERY_CATEGORIES,
  GroceryCategory,
} from "@/lib/grocery-categories";

interface Igrocery {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: GroceryCategory;
  subCategory: string;
  image: string;
  price: number;
  unit: string;
}

const grocerySchema = new mongoose.Schema<Igrocery>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: GROCERY_CATEGORIES,
      required: true,
    },
    subCategory: {
      type: String,
      enum: [
        ...new Set(
          Object.values(CATEGORY_SUBCATEGORIES).flatMap((subcategories) =>
            subcategories.map((subcategory) => subcategory.value),
          ),
        ),
      ],
      required: true,
    },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { timestamps: true },
);

const groceryModel =
  mongoose.models.Grocery || mongoose.model("Grocery", grocerySchema);

export default groceryModel;
