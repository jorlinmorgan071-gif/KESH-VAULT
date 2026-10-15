import { db } from "@/lib/db";

// Package catalogue — exact economics from the source app where observed,
// extrapolated down/up the luxury ladder with the same ROI profile (~155–160%).
const PACKAGES = [
  {
    id: "a-class",
    name: "MERCEDES A-CLASS",
    image: "/cars/a-class.jpg",
    durationDays: 18,
    dailyReturn: 105,
    stake: 1200,
    totalReturn: 1890,
    limitPerUser: 2,
    sortOrder: 1,
  },
  {
    id: "c-class",
    name: "MERCEDES C-CLASS",
    image: "/cars/c-class.jpg",
    durationDays: 22,
    dailyReturn: 143,
    stake: 2000,
    totalReturn: 3146,
    limitPerUser: 2,
    sortOrder: 2,
  },
  {
    id: "e-class",
    name: "MERCEDES E-CLASS",
    image: "/cars/e-class.jpg",
    durationDays: 25,
    dailyReturn: 174,
    stake: 2800,
    totalReturn: 4350,
    limitPerUser: 3,
    sortOrder: 3,
  },
  {
    id: "gle",
    name: "MERCEDES GLE",
    image: "/cars/gle.jpg",
    durationDays: 29,
    dailyReturn: 192,
    stake: 3500,
    totalReturn: 5568,
    limitPerUser: 3,
    sortOrder: 4,
  },
  {
    id: "s-class",
    name: "MERCEDES S-CLASS",
    image: "/cars/s-class.jpg",
    durationDays: 40,
    dailyReturn: 240,
    stake: 6000,
    totalReturn: 9600,
    limitPerUser: 4,
    sortOrder: 5,
  },
  {
    id: "g-class",
    name: "MERCEDES G-CLASS AMG",
    image: "/cars/g-class.jpg",
    durationDays: 45,
    dailyReturn: 425,
    stake: 12000,
    totalReturn: 19125,
    limitPerUser: 2,
    sortOrder: 6,
  },
  {
    id: "maybach",
    name: "MERCEDES MAYBACH",
    image: "/cars/maybach.jpg",
    durationDays: 50,
    dailyReturn: 800,
    stake: 25000,
    totalReturn: 40000,
    limitPerUser: 1,
    sortOrder: 7,
  },
];

const GIFT_CODES = [
  { code: "KVWELCOME", amount: 50, note: "Welcome gift for new members" },
  { code: "VAULT5PM", amount: 25, note: "Daily 5PM release" },
  { code: "GOLDRUSH", amount: 100, note: "Community reward" },
];

let seeded = false;

export async function ensureSeed() {
  if (seeded) return;
  const count = await db.package.count();
  if (count === 0) {
    await db.package.createMany({ data: PACKAGES });
  }
  const giftCount = await db.giftCode.count();
  if (giftCount === 0) {
    await db.giftCode.createMany({ data: GIFT_CODES });
  }
  seeded = true;
}
