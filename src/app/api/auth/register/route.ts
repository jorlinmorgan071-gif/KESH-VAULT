import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { classifyIdentifier, generateInviteCode, generateReference } from "@/lib/ids";
import { createSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

const SIGNUP_BONUS = 100;

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const identifier = String(body.identifier ?? "");
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const referral = String(body.referral ?? "").trim().toUpperCase();

    const { kind, value } = classifyIdentifier(identifier);
    if (kind === "invalid") {
      return NextResponse.json(
        { error: "Enter a valid email address or phone number (07XX / 01XX)." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const existing =
      kind === "email"
        ? await db.user.findUnique({ where: { email: value } })
        : await db.user.findUnique({ where: { phone: value } });
    if (existing) {
      return NextResponse.json(
        { error: "This account already exists. Sign in instead." },
        { status: 409 }
      );
    }

    // Resolve optional referral code → referrer chain (max 3 levels)
    let referrerId: string | null = null;
    if (referral) {
      const referrer = await db.user.findUnique({ where: { inviteCode: referral } });
      if (!referrer) {
        return NextResponse.json(
          { error: "Invite code not recognised. Leave it blank or check the code." },
          { status: 400 }
        );
      }
      referrerId = referrer.id;
    }

    const displayName =
      kind === "email" ? value.split("@")[0] : `member${value.slice(-4)}`;

    // Ensure unique invite code
    let inviteCode = generateInviteCode();
    while (await db.user.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: kind === "email" ? value : null,
          phone: kind === "phone" ? value : await uniquePhone(value),
          passwordHash,
          displayName,
          inviteCode,
          referredById: referrerId,
          mpesaPhone: kind === "phone" ? value : "",
          balance: SIGNUP_BONUS,
        },
      });

      await tx.transaction.create({
        data: {
          userId: created.id,
          type: "BONUS",
          amount: SIGNUP_BONUS,
          status: "COMPLETED",
          reference: generateReference("BONUS"),
          description: "Sign-up bonus credited",
        },
      });

      return created;
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
}

// Users registering with email still need a registered M-Pesa number
// for withdrawals — collect it later in Withdraw Account. Phone column is
// unique-required, so generate a placeholder from the email hash and let
// the member replace it with their real number.
function generateRefPhone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const digits = String(hash).padStart(9, "0").slice(0, 9);
  return "07" + digits;
}

async function uniquePhone(seed: string): Promise<string> {
  let candidate = generateRefPhone(seed);
  let guard = 0;
  while (guard < 50) {
    const exists = await db.user.findUnique({ where: { phone: candidate } });
    if (!exists) return candidate;
    candidate = generateRefPhone(candidate);
    guard++;
  }
  return "07" + String(Date.now()).slice(-9);
}
