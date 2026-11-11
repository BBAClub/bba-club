export type Category =
  | "All"
  | "Cafés"
  | "Food"
  | "Study"
  | "Nightlife"
  | "Outdoors"
  | "Sports";

export type Place = {
  name: string;

  category: Exclude<
    Category,
    "All"
  >;

  area: string;

  address: string;

  description: string;

  price: string;

  distanceFromSchoolKm?: number;

  symbol: string;

  coverImageUrl?: string;

  coverImageAlt?: string;

  latitude: number;

  longitude: number;

  partner?: boolean;

  promoCode?: string;

  promoText?: string;
};

export const categories: Category[] = [
  "All",
  "Cafés",
  "Food",
  "Study",
  "Nightlife",
  "Outdoors",
  "Sports",
];

/*
  Actual Places are loaded from Sanity.
  This empty export is kept temporarily
  for compatibility with older imports.
*/
export const places: Place[] = [];