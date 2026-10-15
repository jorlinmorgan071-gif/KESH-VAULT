import { db } from "@/lib/db";
import { generateReference } from "@/lib/ids";

const DAY_MS = 24 * 60 * 60 * 1000;
// Withdrawals are promised to process within 0-12 hours.
// For this deployment the pipeline is accelerated so members can
// observe the full lifecycle: pending funds settle automatically.
const WITHDRAW_SETTLE_MS = 5 * 60 * 1000;

export type SettleResult = {
  credited: number;
  settledWithdrawals: number;
};

/**
 * Credits any due daily returns for a user's ACTIVE orders and expires
 * completed ones. Idempotent — safe to call on every session fetch.
 */
export async function settleEarnings(userId: string): Promise<SettleResult> {
  const now = new Date();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { credited: 0, settledWithdrawals: 0 };

  let credited = 0;
  const activeOrders = await db.order.findMany({
    where: { userId, status: "ACTIVE" },
  });

  for (const order of activeOrders) {
    const daysElapsed = Math.floor((now.getTime() - order.activatedAt.getTime()) / DAY_MS);
    const payableDays = Math.min(Math.max(daysElapsed, 0), order.durationDays);
    const due = payableDays * order.dailyReturn - order.totalPaidOut;

    if (due > 0.001) {
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { totalPaidOut: { increment: due } },
        });
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: due } },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: "DAILY",
            amount: due,
            status: "COMPLETED",
            reference: generateReference("DAILY"),
            description: `Daily earnings · ${order.packageName}`,
          },
        });
      });
      credited += due;
    }

    if (payableDays >= order.durationDays) {
      await db.order.update({
        where: { id: order.id },
        data: { status: "EXPIRED" },
      });
    }
  }

  // Auto-settle pending withdrawals (accelerated 0-12h pipeline)
  const settledWithdrawals = await db.transaction.updateMany({
    where: {
      userId,
      type: "WITHDRAW",
      status: { in: ["PENDING", "PROCESSING"] },
      createdAt: { lt: new Date(now.getTime() - WITHDRAW_SETTLE_MS) },
    },
    data: { status: "COMPLETED" },
  }).then((r) => r.count);

  return { credited, settledWithdrawals: settledWithdrawals ?? 0 };
}

/** Sum of today's earning-type transactions (daily, referral, check-in, gift). */
export async function getTodayEarnings(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = await db.transaction.aggregate({
    where: {
      userId,
      type: { in: ["DAILY", "REFERRAL", "CHECKIN", "GIFT"] },
      amount: { gt: 0 },
      createdAt: { gte: startOfDay },
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Total invite (referral) income for a user. */
export async function getInviteIncome(userId: string): Promise<number> {
  const result = await db.transaction.aggregate({
    where: { userId, type: "REFERRAL", amount: { gt: 0 } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Descendants of a user up to 3 levels deep (L1 direct, L2, L3). */
export async function getTeamTree(userId: string) {
  const l1 = await db.user.findMany({
    where: { referredById: userId },
    select: { id: true },
  });
  const l1Ids = l1.map((u) => u.id);

  const l2 = l1Ids.length
    ? await db.user.findMany({ where: { referredById: { in: l1Ids } }, select: { id: true } })
    : [];
  const l2Ids = l2.map((u) => u.id);

  const l3 = l2Ids.length
    ? await db.user.findMany({ where: { referredById: { in: l2Ids } }, select: { id: true } })
    : [];
  const l3Ids = l3.map((u) => u.id);

  return { l1Ids, l2Ids, l3Ids, allIds: [...l1Ids, ...l2Ids, ...l3Ids] };
}

export async function getActiveTeamCount(userId: string): Promise<number> {
  const { allIds } = await getTeamTree(userId);
  if (allIds.length === 0) return 0;
  const activeMembers = await db.user.findMany({
    where: { id: { in: allIds } },
    select: { id: true, orders: { where: { status: "ACTIVE" }, select: { id: true } } },
  });
  return activeMembers.filter((m) => m.orders.length > 0).length;
}
