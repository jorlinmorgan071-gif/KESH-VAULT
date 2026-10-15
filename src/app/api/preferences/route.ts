import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/preferences — mark onboarding modals as seen
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, boolean> = {};
  if (body.welcomeSeen === true) data.welcomeSeen = true;
  if (body.guideSeen === true) data.guideSeen = true;

  if (Object.keys(data).length > 0) {
    await db.user.update({ where: { id: user.id }, data });
  }
  return NextResponse.json({ ok: true });
}
