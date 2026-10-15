import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { settleEarnings } from "@/lib/settle";

export const dynamic = "force-dynamic";

// GET /api/records?tab=account|recharge|withdraw
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await settleEarnings(user.id);

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "account";

  let where: object;
  if (tab === "recharge") {
    where = { userId: user.id, type: "RECHARGE" };
  } else if (tab === "withdraw") {
    where = { userId: user.id, type: "WITHDRAW" };
  } else {
    // ACCOUNT — everything that moves the wallet
    where = {
      userId: user.id,
      type: { in: ["BONUS", "PACKAGE", "DAILY", "REFERRAL", "CHECKIN", "GIFT"] },
    };
  }

  const records = await db.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ records });
}
