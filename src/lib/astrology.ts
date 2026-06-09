const SIGN_VALUES = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type Sign = (typeof SIGN_VALUES)[number];

export const SIGNS: Array<{ value: Sign; label: string }> = [
  { value: "aries", label: "טלה" },
  { value: "taurus", label: "שור" },
  { value: "gemini", label: "תאומים" },
  { value: "cancer", label: "סרטן" },
  { value: "leo", label: "אריה" },
  { value: "virgo", label: "בתולה" },
  { value: "libra", label: "מאזניים" },
  { value: "scorpio", label: "עקרב" },
  { value: "sagittarius", label: "קשת" },
  { value: "capricorn", label: "גדי" },
  { value: "aquarius", label: "דלי" },
  { value: "pisces", label: "דגים" },
];

export function getSignLabel(sign: Sign) {
  return SIGNS.find((item) => item.value === sign)?.label ?? sign;
}
