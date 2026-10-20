export const GROCERY_CATEGORIES = [
  "Fruits & vegetables",
  "Dairy, bread & eggs",
  "Snacks & munchies",
  "Cold drinks",
  "Rice, atta & dals",
  "Masala & cooking",
  "Breakfast & sauces",
  "Instant food",
  "Beauty & personal care",
  "Home & cleaning",
  "Baby care",
  "Pet supplies",
] as const;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];

export type GrocerySubcategory = { value: string; label: string };

export const CATEGORY_SUBCATEGORIES: Record<
  GroceryCategory,
  readonly GrocerySubcategory[]
> = {
  "Fruits & vegetables": [
    { value: "fruits", label: "Fresh fruits" },
    { value: "vegetables", label: "Fresh vegetables" },
    { value: "leafy-greens", label: "Leafy greens" },
    { value: "exotic-fruits", label: "Exotic fruits" },
    { value: "herbs-seasonings", label: "Herbs & seasonings" },
    { value: "flowers", label: "Flowers" },
  ],
  "Dairy, bread & eggs": [
    { value: "milk", label: "Milk" },
    { value: "bread", label: "Bread & bakery" },
    { value: "eggs", label: "Eggs" },
    { value: "curd-yogurt", label: "Curd & yogurt" },
    { value: "paneer", label: "Paneer" },
    { value: "cheese", label: "Cheese" },
    { value: "butter", label: "Butter" },
  ],
  "Snacks & munchies": [
    { value: "snacks", label: "Snacks" },
    { value: "munchies", label: "Munchies" },
    { value: "chips-namkeen", label: "Chips & namkeen" },
    { value: "biscuits-cookies", label: "Biscuits & cookies" },
    { value: "chocolates-candies", label: "Chocolates & candies" },
    { value: "nuts-seeds", label: "Nuts & seeds" },
  ],
  "Cold drinks": [
    { value: "colddrinks", label: "Cold drinks" },
    { value: "juices", label: "Juices" },
    { value: "water", label: "Water" },
    { value: "soda-mixers", label: "Soda & mixers" },
    { value: "energy-drinks", label: "Energy drinks" },
    { value: "tea-coffee", label: "Tea & coffee" },
  ],
  "Rice, atta & dals": [
    { value: "rice", label: "Rice" },
    { value: "atta", label: "Atta & flour" },
    { value: "dals", label: "Dals & pulses" },
    { value: "grains-millets", label: "Grains & millets" },
    { value: "poha-sooji", label: "Poha & sooji" },
    { value: "dry-fruits", label: "Dry fruits" },
  ],
  "Masala & cooking": [
    { value: "masala", label: "Masala & spices" },
    { value: "cooking", label: "Cooking essentials" },
    { value: "oils-ghee", label: "Oils & ghee" },
    { value: "salt-sugar", label: "Salt & sugar" },
    { value: "vinegar-sauces", label: "Vinegar & cooking sauces" },
    { value: "whole-spices", label: "Whole spices" },
  ],
  "Breakfast & sauces": [
    { value: "breakfast", label: "Breakfast mixes" },
    { value: "cereals-muesli", label: "Cereals & muesli" },
    { value: "spreads", label: "Spreads" },
    { value: "sauces", label: "Sauces & dips" },
    { value: "honey-jams", label: "Honey & jams" },
    { value: "peanut-butter", label: "Peanut butter" },
  ],
  "Instant food": [
    { value: "instantfood", label: "Instant food" },
    { value: "noodles-pasta", label: "Noodles & pasta" },
    { value: "ready-to-eat", label: "Ready to eat" },
    { value: "soups", label: "Soups" },
    { value: "frozen-food", label: "Frozen food" },
    { value: "instant-mixes", label: "Instant mixes" },
  ],
  "Beauty & personal care": [
    { value: "beauty", label: "Beauty" },
    { value: "personalcare", label: "Personal care" },
    { value: "skin-care", label: "Skin care" },
    { value: "hair-care", label: "Hair care" },
    { value: "bath-body", label: "Bath & body" },
    { value: "oral-care", label: "Oral care" },
  ],
  "Home & cleaning": [
    { value: "home", label: "Home essentials" },
    { value: "cleaning", label: "Cleaning supplies" },
    { value: "laundry", label: "Laundry" },
    { value: "dishwashing", label: "Dishwashing" },
    { value: "home-organization", label: "Home organization" },
    { value: "air-fresheners", label: "Air fresheners" },
  ],
  "Baby care": [
    { value: "babycare", label: "Baby care" },
    { value: "diapers-wipes", label: "Diapers & wipes" },
    { value: "baby-food", label: "Baby food" },
    { value: "baby-bath", label: "Baby bath & skin care" },
    { value: "feeding-accessories", label: "Feeding accessories" },
    { value: "baby-laundry", label: "Baby laundry" },
  ],
  "Pet supplies": [
    { value: "pet", label: "Pet supplies" },
    { value: "dog-food", label: "Dog food" },
    { value: "cat-food", label: "Cat food" },
    { value: "pet-treats", label: "Pet treats" },
    { value: "pet-grooming", label: "Pet grooming" },
    { value: "litter-cleanup", label: "Litter & cleanup" },
  ],
};

export function isGroceryCategory(value: string): value is GroceryCategory {
  return GROCERY_CATEGORIES.some((category) => category === value);
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
