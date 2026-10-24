export const GROCERY_CATEGORIES = [
  "Fruits & Vegetables",
  "Dairy, Bread & Eggs",
  "Snacks & Munchies",
  "Cold Drinks & Beverages",
  "Rice, Atta & Dals",
  "Masala & Cooking",
  "Breakfast & Sauces",
  "Instant Food",
  "Beauty & Personal Care",
  "Home & Cleaning",
  "Baby Care",
  "Pet Supplies",
] as const;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];

export type GrocerySubcategory = { value: string; label: string };

export const CATEGORY_SUBCATEGORIES: Record<
  GroceryCategory,
  readonly GrocerySubcategory[]
> = {
  "Fruits & Vegetables": [
    { value: "fruits", label: "Fresh Fruits" },
    { value: "vegetables", label: "Fresh Vegetables" },
    { value: "leafy-greens", label: "Leafy Greens" },
    { value: "exotic-fruits", label: "Exotic Fruits" },
    { value: "herbs-seasonings", label: "Herbs & Seasonings" },
    { value: "flowers", label: "Flowers" },
  ],
  "Dairy, Bread & Eggs": [
    { value: "milk", label: "Milk" },
    { value: "bread", label: "Bread & Bakery" },
    { value: "eggs", label: "Eggs" },
    { value: "curd-yogurt", label: "Curd & Yogurt" },
    { value: "paneer-tofu", label: "Paneer & Tofu" },
    { value: "cheese-butter", label: "Cheese & Butter" },
    { value: "milkshakes", label: "Milkshakes" },
  ],
  "Snacks & Munchies": [
    { value: "chips", label: "Chips" },
    { value: "namkeen-mixtures", label: "Namkeen & Mixtures" },
    { value: "energy-bars", label: "Energy Bars" },
    { value: "wafers", label: "Wafers" },
    { value: "biscuits-cookies", label: "Biscuits & Cookies" },
    { value: "chocolates-candies", label: "Chocolates & Candies" },
  ],
  "Cold Drinks & Beverages": [
    { value: "colddrinks", label: "Cold Drinks" },
    { value: "juices", label: "Juices" },
    { value: "water", label: "Water" },
    { value: "soda-mixers", label: "Soda & Mixers" },
    { value: "energy-drinks", label: "Energy Drinks" },
    { value: "tea-coffee", label: "Tea & Coffee" },
  ],
  "Rice, Atta & Dals": [
    { value: "rice", label: "Rice" },
    { value: "atta", label: "Atta & Flour" },
    { value: "dals", label: "Dals & Pulses" },
    { value: "grains-millets", label: "Grains & Millets" },
    { value: "poha-sooji", label: "Poha & Sooji" },
    { value: "dry-fruits", label: "Dry Fruits" },
  ],
  "Masala & Cooking": [
    { value: "masala", label: "Masala & Spices" },
    { value: "cooking", label: "Cooking Essentials" },
    { value: "oils-ghee", label: "Oils & Ghee" },
    { value: "salt-sugar", label: "Salt & Sugar" },
    { value: "vinegar-sauces", label: "Vinegar & Cooking Sauces" },
    { value: "whole-spices", label: "Whole Spices" },
  ],
  "Breakfast & Sauces": [
    { value: "breakfast", label: "Breakfast Mixes" },
    { value: "cereals-muesli", label: "Cereals & Muesli" },
    { value: "spreads", label: "Spreads" },
    { value: "sauces", label: "Sauces & Dips" },
    { value: "honey-jams", label: "Honey & Jams" },
    { value: "peanut-butter", label: "Peanut Butter" },
  ],
  "Instant Food": [
    { value: "instantfood", label: "Instant Food" },
    { value: "noodles-pasta", label: "Noodles & Pasta" },
    { value: "popcorn", label: "Popcorn" },
    { value: "soups", label: "Soups" },
    { value: "frozen-food", label: "Frozen Food" },
  ],
  "Beauty & Personal Care": [
    { value: "personalcare", label: "Personal Care" },
    { value: "skin-care", label: "Skin Care" },
    { value: "hair-care", label: "Hair Care" },
    { value: "bath-body", label: "Bath & Body" },
    { value: "oral-care", label: "Oral Care" },
  ],
  "Home & Cleaning": [
    { value: "cleaning", label: "Cleaning Supplies" },
    { value: "laundry", label: "Laundry" },
    { value: "dishwashing", label: "Dishwashing" },
    { value: "home-organization", label: "Home Organization" },
    { value: "air-fresheners", label: "Air Fresheners" },
  ],
  "Baby Care": [
    { value: "babycare", label: "Baby Care" },
    { value: "diapers-wipes", label: "Diapers & Wipes" },
    { value: "baby-food", label: "Baby Food" },
    { value: "baby-bath", label: "Baby Bath & Skin Care" },
    { value: "feeding-accessories", label: "Feeding Accessories" },
    { value: "baby-laundry", label: "Baby Laundry" },
  ],
  "Pet Supplies": [
    { value: "pet", label: "Pet Supplies" },
    { value: "dog-food", label: "Dog Food" },
    { value: "cat-food", label: "Cat Food" },
    { value: "pet-treats", label: "Pet Treats" },
    { value: "pet-grooming", label: "Pet Grooming" },
    { value: "litter-cleanup", label: "Litter & Cleanup" },
  ],
};

export function isGroceryCategory(value: string): value is GroceryCategory {
  return GROCERY_CATEGORIES.some((category) => category === value);
}

export function normalizeGroceryCategory(
  value?: string | null,
): GroceryCategory | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Exact match
  const exact = GROCERY_CATEGORIES.find((cat) => cat === trimmed);
  if (exact) return exact;

  // Case-insensitive match
  const caseInsensitive = GROCERY_CATEGORIES.find(
    (cat) => cat.toLowerCase() === trimmed.toLowerCase(),
  );
  if (caseInsensitive) return caseInsensitive;

  const lower = trimmed.toLowerCase();

  // Alias checks (e.g. "Cold drinks" -> "Cold Drinks & Beverages")
  if (lower.includes("cold drink")) {
    return "Cold Drinks & Beverages";
  }

  // Prefix or partial match
  const partial = GROCERY_CATEGORIES.find(
    (cat) =>
      cat.toLowerCase().startsWith(lower) ||
      lower.startsWith(cat.toLowerCase()),
  );
  if (partial) return partial;

  return null;
}

export function isSubcategoryForCategory(
  category: GroceryCategory,
  subcategory: string,
): boolean {
  return CATEGORY_SUBCATEGORIES[category].some(
    (option) => option.value === subcategory,
  );
}

export function getSubcategoryLabel(
  category: string,
  subcategory: string | null | undefined,
): string {
  if (!subcategory?.trim()) {
    return "Uncategorized";
  }

  if (isGroceryCategory(category)) {
    const option = CATEGORY_SUBCATEGORIES[category].find(
      (item) => item.value === subcategory,
    );
    if (option) {
      return option.label;
    }
  }

  return subcategory
    .split(/[-_]/)
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");
}
