"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, formatKES } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, GoldLabel, MoneyTicker } from "@/components/kv/shared/ui";
import { useToast } from "@/hooks/use-toast";

const QUICK_AMOUNTS = [150, 240, 360, 1350, 2550, 4500];
const FEE_RATE = 0.16;
const MIN = 250;
const MAX = 25000;

/** 9:00–19:00 EAT == 06:00–16:00 UTC */
function windowOpen(): boolean {
  const h = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  return h >= 6 && h < 16;
}

export function WithdrawScreen() {
  const { popSub } = useAppStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(true);
  const [countdown, setCountdown] = useState("");

  const { data: session } = useQuery({ queryKey: ["session"], queryFn: api.session });
  const balance = session?.user?.balance ?? 0;
  const registered = session?.user?.mpesaPhone ?? "";

  // live window check + countdown to next open
  useEffect(() => {
    function tick() {
      const isOpen = windowOpen();
      setOpen(isOpen);
      if (!isOpen) {
        const now = new Date();
        const next = new Date(now);
        // next 06:00 UTC
        next.setUTCHours(6, 0, 0, 0);
        if (now.getUTCHours() >= 16) {
          // after close today → next is tomorrow 6AM UTC (9AM EAT)
        }
        if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
        const diff = next.getTime() - now.getTime();
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        setCountdown(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const amt = typeof amount === "number" ? amount : 0;
  const fee = Math.round(amt * FEE_RATE * 100) / 100;
  const net = Math.max(amt - fee, 0);
  const validAmount = amt >= MIN && amt <= MAX && amt <= balance;

  async function handleSubmit() {
    if (!validAmount || submitting) return;
    setSubmitting(true);
    try {
      const result = await api.withdraw({ amount: amt, phone: phoneEditing ? phone : undefined });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      toast({
        title: "Withdrawal submitted 🏦",
        description: `${formatKES(result.net)} net to your registered M-Pesa. Processed automatically within 0–12 hours.`,
      });
      setAmount("");
    } catch (e) {
      toast({
        title: "Withdrawal failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SubPageHeader title="Withdraw" onBack={popSub} />

      {/* balance */}
      <div className="kv-card p-5">
        <GoldLabel>Available Balance</GoldLabel>
        <MoneyTicker value={balance} className="mt-1 block text-2xl font-extrabold text-white" />
      </div>

      {/* withdraw to */}
      <div className="mt-4">
        <GoldLabel className="mb-2 block">Withdraw To</GoldLabel>
        {!phoneEditing && (
          <div className="kv-card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(212,175,55,0.45)] text-[#d4af37]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
            </div>
            <span className="flex-1 text-sm font-bold text-white">
              {registered || "No M-Pesa number registered"}
            </span>
            {registered ? (
              <span className="pill-gold px-2.5 py-1 text-[9px] font-extrabold tracking-[0.16em]">
                REGISTERED
              </span>
            ) : (
              <span className="rounded-full border border-[rgba(229,57,53,0.4)] bg-[rgba(229,57,53,0.08)] px-2.5 py-1 text-[9px] font-extrabold tracking-[0.16em] text-[#ff8a80]">
                REQUIRED
              </span>
            )}
            <button
              onClick={() => {
                setPhone(registered);
                setPhoneEditing(true);
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] hover:text-[#f0d060]"
            >
              {registered ? "Edit" : "Add"}
            </button>
          </div>
        )}
        {phoneEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div className="kv-card flex items-center gap-2 p-3">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                inputMode="tel"
                className="field min-w-0 flex-1 px-3.5 py-2.5 text-sm"
                maxLength={13}
              />
              <button
                onClick={async () => {
                  try {
                    const r = await api.updateWithdrawAccount(phone);
                    setPhoneEditing(false);
                    await queryClient.invalidateQueries({ queryKey: ["session"] });
                    toast({ title: "M-Pesa number updated", description: r.mpesaPhone });
                  } catch (e) {
                    toast({
                      title: "Invalid number",
                      description: e instanceof Error ? e.message : "",
                      variant: "destructive",
                    });
                  }
                }}
                className="btn-crimson shrink-0 px-4 py-2.5 text-xs font-bold"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* quick amounts */}
      <div className="mt-4">
        <GoldLabel className="mb-2 block">Quick Amounts</GoldLabel>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map((q) => {
            const active = amount === q;
            return (
              <motion.button
                key={q}
                whileTap={{ scale: 0.93 }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                onClick={() => setAmount(q)}
                className={`rounded-xl border py-3 text-xs font-bold transition-colors ${
                  active
                    ? "border-[#e53935] bg-[rgba(229,57,53,0.12)] text-[#ff6b6b] shadow-[0_0_16px_-4px_rgba(229,57,53,0.5)]"
                    : "border-[rgba(255,255,255,0.08)] bg-[#141519] text-[#c9cdd4]"
                }`}
              >
                KES {q.toLocaleString()}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* manual amount */}
      <div className="mt-4">
        <GoldLabel className="mb-2 block">Or Enter Amount</GoldLabel>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#d4af37]">
            KES
          </span>
          <input
            type="number"
            value={amount === "" ? "" : amount}
            onChange={(e) => {
              const v = e.target.value;
              setAmount(v === "" ? "" : Math.max(0, Number(v)));
            }}
            placeholder={`${MIN.toLocaleString()} – ${MAX.toLocaleString()}`}
            inputMode="numeric"
            className="field w-full py-3.5 pl-16 pr-4 text-lg font-bold tracking-wide"
          />
          {amount !== "" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setAmount("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#26272e] px-2 py-0.5 text-[10px] font-bold text-[#8a8f98]"
            >
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {/* fee calculation */}
      <AnimatePresence>
        {amt > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="mt-4 rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[linear-gradient(180deg,rgba(212,175,55,0.07),rgba(212,175,55,0.02))] p-4"
          >
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#8a8f98]">Fee (16%)</span>
              <span className="font-bold text-[#ff8a80]">−{formatKES(fee)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[rgba(212,175,55,0.15)] pt-2.5">
              <span className="text-[#8a8f98]">You receive</span>
              <motion.span
                key={net}
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                className="text-lg font-extrabold text-[#00c853]"
              >
                {formatKES(net)}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* submit */}
      <div className="mt-5">
        <motion.button
          whileTap={open && validAmount && !submitting ? { scale: 0.97 } : undefined}
          disabled={!open || !validAmount || submitting || !registered}
          onClick={handleSubmit}
          className="btn-crimson w-full py-3.5 text-sm font-extrabold tracking-wide"
        >
          {submitting
            ? "Submitting…"
            : !open
              ? `CLOSED · 9 AM – 7 PM`
              : !registered
                ? "REGISTER M-PESA NUMBER"
                : !validAmount
                  ? amt > 0 && amt < MIN
                    ? `MINIMUM ${formatKES(MIN, 0)}`
                    : amt > MAX
                      ? `MAXIMUM ${formatKES(MAX, 0)}`
                      : amt > balance
                        ? "INSUFFICIENT BALANCE"
                        : "WITHDRAW NOW"
                  : `WITHDRAW ${formatKES(amt, 0)}`}
        </motion.button>

        <div className="mt-3.5 space-y-1.5 text-center">
          {!open && countdown && (
            <p className="text-[11px] font-semibold text-[#e9cf6e]">
              Opens in {countdown} · Withdrawals 9:00 AM – 7:00 PM EAT
            </p>
          )}
          <p className="text-[10px] leading-relaxed text-[#787d86]">
            No daily withdrawal limit in effect.
            <br />
            Sent to your registered M-Pesa number. Fee: 16% per transaction.
          </p>
          <p className="text-[10px] text-[#787d86]">Deposits remain open 24/7.</p>
        </div>
      </div>
    </div>
  );
}
