import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getTeamTree, getInviteIncome, getActiveTeamCount } from "@/lib/settle";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { l1Ids, l2Ids, l3Ids } = await getTeamTree(user.id);

  async function members(ids: string[], level: number) {
    if (ids.length === 0) return [];
    const users = await db.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        displayName: true,
        createdAt: true,
        orders: { where: { status: "ACTIVE" }, select: { packageName: true } },
      },
    });
    return users.map((u) => ({
      id: u.id.replace(/-/g, "").slice(0, 8),
      displayName: u.displayName,
      joinedAt: u.createdAt,
      active: u.orders.length > 0,
      activePackages: u.orders.map((o) => o.packageName),
      level,
    }));
  }

  const [level1, level2, level3, inviteIncome, activeTeam] = await Promise.all([
    members(l1Ids, 1),
    members(l2Ids, 2),
    members(l3Ids, 3),
    getInviteIncome(user.id),
    getActiveTeamCount(user.id),
  ]);

  const teamSize = l1Ids.length + l2Ids.length + l3Ids.length;
  const totalActive = [...level1, ...level2, ...level3].filter((m) => m.active).length;

  return NextResponse.json({
    inviteCode: user.inviteCode,
    inviteLink: "", // built client-side from location.origin
    stats: { teamSize, totalActive, inviteIncome, activeTeam },
    levels: { level1, level2, level3 },
    commission: { l1: 12, l2: 5, l3: 3 },
  });
}
