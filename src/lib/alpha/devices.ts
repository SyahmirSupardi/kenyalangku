/* Android brands offered in the claim form's dropdown. */
export const ANDROID_BRANDS = [
  "Samsung",
  "Xiaomi",
  "Redmi",
  "POCO",
  "Oppo",
  "Vivo",
  "Realme",
  "Honor",
  "Huawei",
  "Google Pixel",
  "OnePlus",
  "Infinix",
  "Tecno",
  "itel",
  "Motorola",
  "Nokia",
  "Sony",
  "ASUS",
  "Lenovo",
  "Nothing",
  "ZTE",
  "Other",
] as const;

export type AndroidBrand = (typeof ANDROID_BRANDS)[number];

export function isAndroidBrand(value: unknown): value is AndroidBrand {
  return typeof value === "string" && (ANDROID_BRANDS as readonly string[]).includes(value);
}
