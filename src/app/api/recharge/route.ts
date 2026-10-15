import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateReference } from "@/lib/ids";

export const dynamic = "force-dynamic";

// Recharge via Airtel Money — deposits are open 24/7.
// min 50, max 150000
const MIN = 50;
const MAX = 150000;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const amount = Math.round(Number(body.amount) * 100) / 100;
    const phone = String(body.phone ?? user.mpesaPhone ?? user.phone).trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    }
    if (amount < MIN) {
      return NextResponse.json({ error: `Minimum recharge is KES ${MIN}.` }, { status: 400 });
    }
    if (amount > MAX) {
      return NextResponse.json(
        { error: `Maximum recharge is KES ${MAX.toLocaleString()} per transaction.` },
        { status: 400 }
      );
    }

    // Airtel Money collects the payment from the member's phone.
    // The gateway confirms asynchronously; funds are credited on confirmation.
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amount } },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "RECHARGE",
          amount,
          status: "COMPLETED",
          reference: generateReference("RECHARGE"),
          description: `Airtel Money recharge from ${phone}`,
        },
      });
    });

    return NextResponse.json({ ok: true, credited: amount, phone });
  } catch (e) {
    console.error("recharge error", e);
    return NextResponse.json({ error: "Could not complete the recharge." }, { status: 500 });
  }
}
