import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/ids";

export const dynamic = "force-dynamic";

// Withdraw Account — registered M-Pesa number for payouts
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ mpesaPhone: user.mpesaPhone });
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const raw = String(body.phone ?? "");
    const normalized = normalizePhone(raw);
    if (!normalized) {
      return NextResponse.json(
        { error: "Enter a valid M-Pesa number (07XX or 01XX, Safaricom)." },
        { status: 400 }
      );
    }

    await db.user.update({ where: { id: user.id }, data: { mpesaPhone: normalized } });
    return NextResponse.json({ ok: true, mpesaPhone: normalized });
  } catch (e) {
    console.error("withdraw-account error", e);
    return NextResponse.json({ error: "Could not update the account." }, { status: 500 });
  }
}
