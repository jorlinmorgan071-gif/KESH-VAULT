import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { settleEarnings, getTodayEarnings, getInviteIncome, getActiveTeamCount } from "@/lib/settle";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeed();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  await settleEarnings(user.id);
  const refreshed = await db.user.findUnique({ where: { id: user.id } });

  const [todayEarnings, inviteIncome, activeTeam, activeOrders] = await Promise.all([
    getTodayEarnings(user.id),
    getInviteIncome(user.id),
    getActiveTeamCount(user.id),
    db.order.count({ where: { userId: user.id, status: "ACTIVE" } }),
  ]);

  return NextResponse.json({
    user: {
      id: refreshed!.id,
      shortId: refreshed!.id.replace(/-/g, "").slice(0, 8),
      email: refreshed!.email,
      phone: refreshed!.phone,
      displayName: refreshed!.displayName,
      mpesaPhone: refreshed!.mpesaPhone,
      inviteCode: refreshed!.inviteCode,
      balance: refreshed!.balance,
      welcomeSeen: refreshed!.welcomeSeen,
      guideSeen: refreshed!.guideSeen,
      lastCheckIn: refreshed!.lastCheckIn,
      createdAt: refreshed!.createdAt,
    },
    stats: {
      todayEarnings,
      inviteIncome,
      activeTeam,
      activeOrders,
    },
  });
}
