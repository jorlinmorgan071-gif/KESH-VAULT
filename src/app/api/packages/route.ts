import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeed } from "@/lib/seed";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const packages = await db.package.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ packages: packages.map((p) => ({ ...p, ownedCount: 0 })) });
  }

  const orders = await db.order.findMany({
    where: { userId: user.id },
    select: { packageId: true, status: true },
  });
  const owned: Record<string, number> = {};
  for (const o of orders) {
    owned[o.packageId] = (owned[o.packageId] ?? 0) + 1;
  }

  return NextResponse.json({
    packages: packages.map((p) => ({
      ...p,
      ownedCount: owned[p.id] ?? 0,
    })),
  });
}
