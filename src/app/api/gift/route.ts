import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateReference } from "@/lib/ids";

export const dynamic = "force-dynamic";

// POST /api/gift — redeem a gift code (released daily at 5:00 PM)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Enter a gift code." }, { status: 400 });
    }

    const gift = await db.giftCode.findUnique({ where: { code } });
    if (!gift || !gift.active) {
      return NextResponse.json({ error: "This code is not valid." }, { status: 400 });
    }

    // One redemption per user per code
    const already = await db.coupon.findFirst({ where: { userId: user.id, code } });
    if (already) {
      return NextResponse.json(
        { error: "You have already redeemed this code." },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: gift.amount } },
      });
      await tx.coupon.create({
        data: {
          userId: user.id,
          code,
          amount: gift.amount,
          status: "REDEEMED",
        },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "GIFT",
          amount: gift.amount,
          status: "COMPLETED",
          reference: generateReference("GIFT"),
          description: `Gift code ${code} redeemed`,
        },
      });
      await tx.giftCode.update({
        where: { code },
        data: { uses: { increment: 1 } },
      });
    });

    return NextResponse.json({ ok: true, amount: gift.amount });
  } catch (e) {
    console.error("gift error", e);
    return NextResponse.json({ error: "Could not redeem the code." }, { status: 500 });
  }
}
