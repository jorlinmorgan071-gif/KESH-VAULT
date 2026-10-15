import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { classifyIdentifier, isEmail, normalizePhone, generateInviteCode, generateReference } from "@/lib/ids";
import { createSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

const SIGNUP_BONUS = 100;

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const referral = String(body.referral ?? "").trim().toUpperCase();

    // ---- New multi-field registration (Full name / Phone / Email) ----
    const hasFullName = "fullName" in body;
    if (hasFullName) {
      const fullName = String(body.fullName ?? "").trim();
      const emailRaw = String(body.email ?? "").trim().toLowerCase();
      const phoneRaw = String(body.phone ?? "").trim();

      if (fullName.length < 2) {
        return NextResponse.json({ error: "Enter your full name.", code: "NAME" }, { status: 400 });
      }
      if (!isEmail(emailRaw)) {
        return NextResponse.json(
          { error: "Enter a valid email address — you will use it to log in.", code: "EMAIL" },
          { status: 400 }
        );
      }
      const phone = normalizePhone(phoneRaw);
      if (!phone) {
        return NextResponse.json(
          { error: "Enter a valid Kenyan phone number (07XX / 01XX XXX XXX).", code: "PHONE" },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters.", code: "PASSWORD" },
          { status: 400 }
        );
      }
      if (password !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match.", code: "PASSWORD" }, { status: 400 });
      }

      const emailTaken = await db.user.findUnique({ where: { email: emailRaw } });
      if (emailTaken) {
        return NextResponse.json(
          { error: "That email is already registered. Log in instead.", code: "EMAIL_TAKEN" },
          { status: 409 }
        );
      }
      const phoneTaken = await db.user.findUnique({ where: { phone } });
      if (phoneTaken) {
        return NextResponse.json(
          { error: "That phone number is already registered. Log in instead.", code: "PHONE_TAKEN" },
          { status: 409 }
        );
      }

      const referrer = await resolveReferral(referral);
      if (referrer.error) {
        return NextResponse.json({ error: referrer.error }, { status: 400 });
      }

      let inviteCode = generateInviteCode();
      while (await db.user.findUnique({ where: { inviteCode } })) {
        inviteCode = generateInviteCode();
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: emailRaw,
            phone,
            passwordHash,
            displayName: fullName,
            inviteCode,
            referredById: referrer.id,
            mpesaPhone: phone,
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
    }

    // ---- Legacy single-identifier registration (kept for compatibility) ----
    const identifier = String(body.identifier ?? "");
    const { kind, value } = classifyIdentifier(identifier);
    if (kind === "invalid") {
      return NextResponse.json(
        { error: "Enter a valid email address or phone number (07XX / 01XX)." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
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

    const referrer = await resolveReferral(referral);
    if (referrer.error) {
      return NextResponse.json({ error: referrer.error }, { status: 400 });
    }

    const displayName =
      kind === "email" ? value.split("@")[0] : `member${value.slice(-4)}`;

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
          referredById: referrer.id,
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

async function resolveReferral(
  referral: string
): Promise<{ id: string | null; error?: string }> {
  if (!referral) return { id: null };
  const referrer = await db.user.findUnique({ where: { inviteCode: referral } });
  if (!referrer) {
    return { id: null, error: "Invite code not recognised. Leave it blank or check the code." };
  }
  return { id: referrer.id };
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
