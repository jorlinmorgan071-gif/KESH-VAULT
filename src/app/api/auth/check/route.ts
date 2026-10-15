import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyIdentifier } from "@/lib/ids";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier ?? "");
    const { kind, value } = classifyIdentifier(identifier);

    if (kind === "invalid") {
      return NextResponse.json(
        { error: "Enter a valid email address or phone number (07XX / 01XX)." },
        { status: 400 }
      );
    }

    const user =
      kind === "email"
        ? await db.user.findUnique({ where: { email: value } })
        : await db.user.findUnique({ where: { phone: value } });

    return NextResponse.json({ exists: !!user, kind });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
