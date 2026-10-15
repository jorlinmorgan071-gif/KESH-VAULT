"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { api, formatKES } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, GoldLabel } from "@/components/kv/shared/ui";
import { useSession } from "@/components/kv/AppShell";
import { useToast } from "@/hooks/use-toast";

export function BonusScreen() {
  const { popSub } = useAppStore();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [redeeming, setRedeieming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [nextRelease, setNextRelease] = useState("");

  const lastCheckIn = session?.user?.lastCheckIn ? new Date(session.user.lastCheckIn) : null;
  const canCheckIn =
    !lastCheckIn || Date.now() - lastCheckIn.getTime() > 24 * 60 * 60 * 1000;

  // Gift codes are released daily at 5:00 PM EAT (14:00 UTC)
  useEffect(() => {
    function tick() {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(14, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setNextRelease(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleCheckIn() {
    if (!canCheckIn || claiming) return;
    setClaiming(true);
    try {
      const r = await api.checkin();
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      toast({ title: "Bonus claimed 🎁", description: `KES ${r.amount} added to your wallet.` });
    } catch (e) {
      toast({
        title: "Already claimed",
        description: e instanceof Error ? e.message : "Come back tomorrow.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  }

  async function handleRedeem() {
    if (!code.trim() || redeeming) return;
    setRedeieming(true);
    try {
      const r = await api.redeemGift(code.trim());
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast({ title: "Gift code redeemed 🎟️", description: `KES ${r.amount} credited.` });
      setCode("");
    } catch (e) {
      toast({
        title: "Invalid code",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setRedeieming(false);
    }
  }

  return (
    <div>
      <SubPageHeader title="Bonus" onBack={popSub} />

      {/* daily check-in */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="kv-card-gold p-5 text-center"
      >
        <motion.div
          animate={canCheckIn ? { scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] } : {}}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.4)] bg-[rgba(212,175,55,0.1)] text-2xl"
          aria-hidden
        >
          🎁
        </motion.div>
        <GoldLabel>Daily Check-In</GoldLabel>
        <p className="mt-2 text-2xl font-extrabold gold-text">KES 5 – 15</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#8a8f98]">
          Claim a surprise bonus once every 24 hours.
        </p>
        <motion.button
          whileTap={canCheckIn ? { scale: 0.96 } : undefined}
          disabled={!canCheckIn || claiming}
          onClick={handleCheckIn}
          className="btn-crimson mt-4 w-full py-3.5 text-sm font-extrabold tracking-wide"
        >
          {claiming ? "Claiming…" : canCheckIn ? "CLAIM TODAY'S BONUS" : "CLAIMED — BACK TOMORROW"}
        </motion.button>
      </motion.div>

      {/* gift codes */}
      <div className="mt-5">
        <GoldLabel className="mb-2 block">Gift Code</GoldLabel>
        <div className="kv-card p-5">
          <p className="text-xs leading-relaxed text-[#8a8f98]">
            Gift codes are released daily at{" "}
            <span className="font-bold text-[#e9cf6e]">5:00 PM</span> in the official community
            channels. Enter a valid code to credit its value instantly.
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              maxLength={12}
              className="field min-w-0 flex-1 px-4 py-3.5 text-center text-sm font-bold tracking-[0.24em]"
              onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
            />
            <motion.button
              whileTap={code.trim() && !redeeming ? { scale: 0.95 } : undefined}
              disabled={!code.trim() || redeeming}
              onClick={handleRedeem}
              className="btn-crimson shrink-0 px-5 py-3.5 text-xs font-extrabold"
            >
              {redeeming ? "…" : "REDEEM"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* release countdown */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center justify-between rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[linear-gradient(180deg,rgba(212,175,55,0.06),transparent)] px-4 py-3.5"
        >
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">
              Next 5:00 PM release in
            </div>
            <div className="mt-0.5 text-[10px] text-[#787d86]">
              Watch the official WhatsApp & Telegram groups for codes
            </div>
          </div>
          <span className="shrink-0 font-mono text-sm font-bold text-[#e9cf6e]">{nextRelease}</span>
        </motion.div>
      </AnimatePresence>

      <p className="mt-4 pb-2 text-center text-[10px] leading-relaxed text-[#4d525a]">
        Team task rewards up to {formatKES(60000, 0)} · Weekly Top Earner pool {formatKES(40000, 0)}
      </p>
    </div>
  );
}
