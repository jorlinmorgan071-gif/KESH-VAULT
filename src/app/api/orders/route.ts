import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateReference } from "@/lib/ids";
import { ensureSeed } from "@/lib/seed";
import { settleEarnings } from "@/lib/settle";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// GET /api/orders — income page payload (live order status)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await settleEarnings(user.id);

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const enriched = orders.map((o) => {
    const daysElapsed = Math.min(
      Math.max(Math.floor((now - o.activatedAt.getTime()) / DAY_MS), 0),
      o.durationDays
    );
    const remainingDays = Math.max(o.durationDays - daysElapsed, 0);
    return {
      ...o,
      daysElapsed,
      remainingDays,
      dailyToCome: remainingDays * o.dailyReturn,
      progress: Math.round((daysElapsed / o.durationDays) * 100),
    };
  });

  // Earning history: all credit transactions of earning types
  const history = await db.transaction.findMany({
    where: { userId: user.id, type: { in: ["DAILY", "REFERRAL", "CHECKIN", "GIFT", "BONUS"] } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return NextResponse.json({ orders: enriched, history });
}

// POST /api/orders — activate a package
export async function POST(req: Request) {
  try {
    await ensureSeed();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await settleEarnings(user.id);
    const fresh = await db.user.findUnique({ where: { id: user.id } });

    const body = await req.json();
    const packageId = String(body.packageId ?? "");
    const pkg = await db.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.active) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    // Purchase limit
    const ownedCount = await db.order.count({ where: { userId: user.id, packageId } });
    if (ownedCount >= pkg.limitPerUser) {
      return NextResponse.json(
        { error: `Purchase limit reached (×${pkg.limitPerUser} for this package).` },
        { status: 400 }
      );
    }

    if (fresh!.balance < pkg.stake) {
      return NextResponse.json(
        { error: "Insufficient balance. Recharge your wallet first." },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + pkg.durationDays * DAY_MS);

    const order = await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: pkg.stake } },
      });

      const created = await tx.order.create({
        data: {
          userId: user.id,
          packageId: pkg.id,
          packageName: pkg.name,
          packageImage: pkg.image,
          stakePaid: pkg.stake,
          dailyReturn: pkg.dailyReturn,
          durationDays: pkg.durationDays,
          totalReturn: pkg.totalReturn,
          status: "ACTIVE",
          expiresAt,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "PACKAGE",
          amount: -pkg.stake,
          status: "COMPLETED",
          reference: generateReference("PACKAGE"),
          description: `Activated ${pkg.name} · ${pkg.durationDays} days`,
        },
      });

      // 3-level referral commissions: 12% / 5% / 3% of stake
      const rates = [0.12, 0.05, 0.03];
      const levelNames = ["Level 1", "Level 2", "Level 3"];
      let currentId: string | null = fresh!.referredById;
      let level = 0;
      while (currentId && level < 3) {
        const ancestor = await tx.user.findUnique({ where: { id: currentId } });
        if (!ancestor) break;
        const commission = Math.round(pkg.stake * rates[level] * 100) / 100;
        if (commission > 0) {
          await tx.user.update({
            where: { id: ancestor.id },
            data: { balance: { increment: commission } },
          });
          await tx.transaction.create({
            data: {
              userId: ancestor.id,
              type: "REFERRAL",
              amount: commission,
              status: "COMPLETED",
              reference: generateReference("REFERRAL"),
              description: `${levelNames[level]} commission · ${user.displayName} activated ${pkg.name}`,
            },
          });
        }
        currentId = ancestor.referredById;
        level++;
      }

      return created;
    });

    return NextResponse.json({ ok: true, order });
  } catch (e) {
    console.error("order error", e);
    return NextResponse.json({ error: "Could not activate the package." }, { status: 500 });
  }
}
