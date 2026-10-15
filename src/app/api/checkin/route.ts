import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateReference } from "@/lib/ids";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// Daily check-in bonus: claim once every 24 hours, KES 5–15
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    if (user.lastCheckIn && Date.now() - user.lastCheckIn.getTime() < DAY_MS) {
      const nextIn = DAY_MS - (Date.now() - user.lastCheckIn.getTime());
      const hours = Math.floor(nextIn / 3_600_000);
      const minutes = Math.floor((nextIn % 3_600_000) / 60_000);
      return NextResponse.json(
        { error: `Already claimed today. Next check-in in ${hours}h ${minutes}m.` },
        { status: 400 }
      );
    }

    const amount = 5 + Math.floor(Math.random() * 11); // 5–15
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amount }, lastCheckIn: new Date() },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "CHECKIN",
          amount,
          status: "COMPLETED",
          reference: generateReference("CHECKIN"),
          description: "Daily check-in reward",
        },
      });
    });

    return NextResponse.json({ ok: true, amount });
  } catch (e) {
    console.error("checkin error", e);
    return NextResponse.json({ error: "Could not claim the bonus." }, { status: 500 });
  }
}
