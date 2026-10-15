import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { classifyIdentifier } from "@/lib/ids";
import { createSession } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json();
    const identifier = String(body.identifier ?? "");
    const password = String(body.password ?? "");

    const { kind, value } = classifyIdentifier(identifier);
    if (kind === "invalid") {
      return NextResponse.json(
        { error: "Enter a valid email address or phone number." },
        { status: 400 }
      );
    }

    const user =
      kind === "email"
        ? await db.user.findUnique({ where: { email: value } })
        : await db.user.findUnique({ where: { phone: value } });

    if (!user) {
      return NextResponse.json({ error: "No account found for this email or phone." }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password. Try again." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json({ error: "Could not sign you in." }, { status: 500 });
  }
}
