import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateReference, normalizePhone } from "@/lib/ids";
import { settleEarnings } from "@/lib/settle";

export const dynamic = "force-dynamic";

export const WITHDRAW_RULES = {
  feeRate: 0.16,
  min: 250,
  max: 25000,
  // Window 09:00–19:00 East Africa Time (UTC+3) → 06:00–16:00 UTC
  windowOpenUtcHour: 6,
  windowCloseUtcHour: 16,
};

export function withdrawalWindowOpen(now = new Date()): boolean {
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  return utcHour >= WITHDRAW_RULES.windowOpenUtcHour && utcHour < WITHDRAW_RULES.windowCloseUtcHour;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({
    balance: user.balance,
    mpesaPhone: user.mpesaPhone,
    rules: WITHDRAW_RULES,
    windowOpen: withdrawalWindowOpen(),
  });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await settleEarnings(user.id);
    const fresh = await db.user.findUnique({ where: { id: user.id } });

    const body = await req.json();
    const amount = Math.round(Number(body.amount) * 100) / 100;
    const phoneInput = String(body.phone ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    }
    if (amount < WITHDRAW_RULES.min) {
      return NextResponse.json(
        { error: `Minimum withdrawal is KES ${WITHDRAW_RULES.min}.` },
        { status: 400 }
      );
    }
    if (amount > WITHDRAW_RULES.max) {
      return NextResponse.json(
        { error: `Maximum per transaction is KES ${WITHDRAW_RULES.max.toLocaleString()}.` },
        { status: 400 }
      );
    }
    if (amount > fresh!.balance) {
      return NextResponse.json({ error: "Amount exceeds your available balance." }, { status: 400 });
    }
    if (!withdrawalWindowOpen()) {
      return NextResponse.json(
        { error: "Withdrawals are open 9:00 AM – 7:00 PM EAT. Deposits remain open 24/7." },
        { status: 400 }
      );
    }

    let mpesaPhone = fresh!.mpesaPhone;
    if (phoneInput) {
      const normalized = normalizePhone(phoneInput);
      if (!normalized) {
        return NextResponse.json(
          { error: "Enter a valid M-Pesa number (07XX / 01XX)." },
          { status: 400 }
        );
      }
      await db.user.update({ where: { id: user.id }, data: { mpesaPhone: normalized } });
      mpesaPhone = normalized;
    }

    if (!mpesaPhone) {
      return NextResponse.json(
        { error: "Register an M-Pesa number before withdrawing." },
        { status: 400 }
      );
    }

    const fee = Math.round(amount * WITHDRAW_RULES.feeRate * 100) / 100;
    const net = Math.round((amount - fee) * 100) / 100;

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAW",
          amount: -amount,
          status: "PROCESSING",
          reference: generateReference("WITHDRAW"),
          description: `Withdrawal to ${mpesaPhone} · fee ${fee.toFixed(2)} · net ${net.toFixed(2)}`,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      fee,
      net,
      reference: "WDR",
    });
  } catch (e) {
    console.error("withdraw error", e);
    return NextResponse.json({ error: "Could not process the withdrawal." }, { status: 500 });
  }
}
