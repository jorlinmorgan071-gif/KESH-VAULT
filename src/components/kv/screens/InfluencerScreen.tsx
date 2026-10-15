"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, formatKES } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, GoldLabel, StatTile } from "@/components/kv/shared/ui";
import { useSession } from "@/components/kv/AppShell";
import { useToast } from "@/hooks/use-toast";

export function InfluencerScreen() {
  const { popSub } = useAppStore();
  const { data: session } = useSession();
  const { toast } = useToast();
  const { data } = useQuery({ queryKey: ["team"], queryFn: api.team });

  const code = data?.inviteCode ?? session?.user?.inviteCode ?? "";
  const stats = data?.stats;
  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : `/?ref=${code}`;

  const shareText = `Join KeshVault with my invite code ${code} — private rewards, daily growth, seamless M-Pesa liquidity.`;

  function copy(text: string, label: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: `${label} copied` }))
      .catch(() => toast({ title: "Could not copy", variant: "destructive" }));
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText + " " + inviteLink)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div>
      <SubPageHeader title="Influencer" onBack={popSub} />

      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="kv-card-gold p-5 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.4)] bg-[rgba(212,175,55,0.1)] text-2xl"
          aria-hidden
        >
          🚀
        </motion.div>
        <h2 className="text-lg font-extrabold text-white">Earn as an influencer</h2>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#8a8f98]">
          Grow your 3-level network and earn commissions on every package your
          teammates activate: 12% · 5% · 3%.
        </p>
        <div className="gold-text mt-4 text-3xl font-extrabold tracking-[0.28em]">{code}</div>
      </motion.div>

      <div className="mt-4 flex gap-2.5">
        <StatTile label="Team Size" value={stats?.teamSize ?? 0} />
        <StatTile label="Active" value={stats?.totalActive ?? 0} accent="gold" />
        <StatTile label="Income" value={stats?.inviteIncome ?? 0} money accent="green" />
      </div>

      {/* actions */}
      <div className="mt-5 space-y-2.5">
        <GoldLabel className="mb-2 block">Share Your Invite</GoldLabel>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => copy(inviteLink, "Invite link")}
          className="btn-crimson w-full py-3.5 text-sm font-extrabold"
        >
          Copy invite link
        </motion.button>
        <div className="flex gap-2.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={shareWhatsApp}
            className="btn-gold-outline flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8Z" />
            </svg>
            WhatsApp
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={shareTelegram}
            className="btn-gold-outline flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Telegram
          </motion.button>
        </div>
      </div>

      {/* how commissions work */}
      <div className="mt-5 kv-card p-5">
        <GoldLabel>Commission Structure</GoldLabel>
        <div className="mt-3 space-y-2.5">
          {[
            { level: "Level 1", rate: 12, desc: "Direct invites — teammates you bring in yourself" },
            { level: "Level 2", rate: 5, desc: "Invites made by your Level 1 teammates" },
            { level: "Level 3", rate: 3, desc: "Invites made by your Level 2 teammates" },
          ].map((row) => (
            <div
              key={row.level}
              className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#141519] p-3"
            >
              <span className="gold-text w-12 text-right text-lg font-extrabold">{row.rate}%</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">{row.level}</div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-[#787d86]">{row.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3.5 text-[10px] leading-relaxed text-[#787d86]">
          Commissions are credited to your wallet instantly when a teammate activates a
          package. Team task rewards reach up to {formatKES(60000, 0)}.
        </p>
      </div>
    </div>
  );
}
