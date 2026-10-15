import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { classifyIdentifier, normalizePhone } from "@/lib/ids";
import { createSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

/**
 * Password recovery without external services:
 * 1) "start"  — member enters the email/phone on the account; we reply with a
 *               masked hint of the phone number registered on that account.
 * 2) "reset"  — member proves ownership by entering the full registered phone
 *               number, then sets a new password. On success they are signed
 *               straight back in.
 */
export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const action = String(body.action ?? "");
    const identifier = String(body.identifier ?? "");

    const { kind, value } = classifyIdentifier(identifier);
    if (kind === "invalid") {
      return NextResponse.json(
        { error: "Enter the email address or phone number on your account." },
        { status: 400 }
      );
    }

    const user =
      kind === "email"
        ? await db.user.findUnique({ where: { email: value } })
        : await db.user.findUnique({ where: { phone: value } });

    if (!user) {
      return NextResponse.json(
        { error: "No account found for this email or phone.", code: "NO_ACCOUNT" },
        { status: 404 }
      );
    }

    if (action === "start") {
      const masked = maskPhone(user.phone);
      return NextResponse.json({ ok: true, maskedPhone: masked });
    }

    if (action === "reset") {
      const phone = normalizePhone(String(body.phone ?? ""));
      if (!phone) {
        return NextResponse.json(
          { error: "Enter a valid phone number (07XX / 01XX XXX XXX)." },
          { status: 400 }
        );
      }
      if (phone !== user.phone && phone !== normalizePhone(user.mpesaPhone ?? "")) {
        return NextResponse.json(
          { error: "That phone number does not match this account. Try again." },
          { status: 401 }
        );
      }

      const newPassword = String(body.newPassword ?? "");
      const confirmPassword = String(body.confirmPassword ?? "");
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.user.update({ where: { id: user.id }, data: { passwordHash } });
      await createSession(user.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    console.error("forgot error", e);
    return NextResponse.json({ error: "Could not reset your password." }, { status: 500 });
  }
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 6) return "••••";
  const head = digits.slice(0, 3);
  const tail = digits.slice(-2);
  const dots = "•".repeat(Math.max(digits.length - 5, 3));
  return `${head}${dots}${tail}`;
}
