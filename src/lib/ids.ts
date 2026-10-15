import { randomBytes, randomUUID } from "crypto";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

const REF_PREFIXES: Record<string, string> = {
  BONUS: "BON",
  RECHARGE: "RCH",
  WITHDRAW: "WDR",
  PACKAGE: "PKG",
  DAILY: "DAY",
  REFERRAL: "REF",
  CHECKIN: "CHK",
  GIFT: "GFT",
};

export function generateReference(type: string): string {
  const prefix = REF_PREFIXES[type] ?? "TXN";
  const hex = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${hex}`;
}

export function generateUUID(): string {
  return randomUUID();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  // Kenyan formats: 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
  if (/^0(7|1)\d{8}$/.test(digits)) return digits;
  if (/^254(7|1)\d{8}$/.test(digits)) return "0" + digits.slice(3);
  return null;
}

export function isEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim());
}

export function classifyIdentifier(raw: string): { kind: "email" | "phone" | "invalid"; value: string } {
  const trimmed = raw.trim();
  if (isEmail(trimmed)) return { kind: "email", value: trimmed.toLowerCase() };
  const phone = normalizePhone(trimmed);
  if (phone) return { kind: "phone", value: phone };
  return { kind: "invalid", value: trimmed };
}
