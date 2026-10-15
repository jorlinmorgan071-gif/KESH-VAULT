"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, TeamMember } from "@/lib/api";
import { formatKES } from "@/lib/api";
import { stagger, riseIn, GoldLabel, StatTile } from "@/components/kv/shared/ui";
import { useSession } from "@/components/kv/AppShell";
import { useToast } from "@/hooks/use-toast";

export function TeamScreen() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [level, setLevel] = useState<1 | 2 | 3>(1);

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: api.team,
  });

  const inviteCode = data?.inviteCode ?? session?.user?.inviteCode ?? "";
  const stats = data?.stats;
  const members =
    level === 1 ? data?.levels.level1 : level === 2 ? data?.levels.level2 : data?.levels.level3;
  const commission = data?.commission;

  function copy(text: string, label: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: `${label} copied`, description: text }))
      .catch(() => toast({ title: "Could not copy", description: "Copy manually instead.", variant: "destructive" }));
  }

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${inviteCode}`
      : `/?ref=${inviteCode}`;

  return (
    <div className="pt-2">
      <h1 className="mb-4 text-xl font-extrabold text-white">Team</h1>

      {/* invite code hero card */}
      <motion.div
        variants={riseIn}
        initial="hidden"
        animate="show"
        className="kv-card-gold relative overflow-hidden p-5 text-center"
      >
        <GoldLabel>Your invite code</GoldLabel>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.15 }}
          className="gold-text mt-2 text-4xl font-extrabold tracking-[0.28em]"
        >
          {inviteCode || "······"}
        </motion.div>

        <div className="mt-4 flex gap-2.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            onClick={() => copy(inviteCode, "Invite code")}
            className="btn-gold-outline flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy code
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            onClick={() => copy(inviteLink, "Invite link")}
            className="btn-crimson flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Copy invite link
          </motion.button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[rgba(212,175,55,0.15)] pt-3.5">
          <CommissionChip level="L1" rate={commission?.l1 ?? 12} />
          <CommissionChip level="L2" rate={commission?.l2 ?? 5} />
          <CommissionChip level="L3" rate={commission?.l3 ?? 3} />
        </div>
      </motion.div>

      {/* stats */}
      <div className="mt-4 flex gap-2.5">
        <StatTile label="Team Size" value={stats?.teamSize ?? 0} />
        <StatTile label="Total Active" value={stats?.totalActive ?? 0} accent="gold" />
        <StatTile label="Invite Income" value={stats?.inviteIncome ?? 0} money accent="green" />
      </div>

      {/* level tabs */}
      <div className="relative mt-5 mb-4 grid grid-cols-3 rounded-full border border-[rgba(255,255,255,0.07)] bg-[#141519] p-1">
        {([1, 2, 3] as const).map((lv) => {
          const active = level === lv;
          const count =
            lv === 1
              ? data?.levels.level1.length ?? 0
              : lv === 2
                ? data?.levels.level2.length ?? 0
                : data?.levels.level3.length ?? 0;
          return (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={`relative z-10 rounded-full py-2 text-[11px] font-bold tracking-wide transition-colors ${
                active ? "text-white" : "text-[#787d86]"
              }`}
              aria-pressed={active}
            >
              {active && (
                <motion.span
                  layoutId="team-tab"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-[#e0293f] to-[#a3172d] shadow-[0_4px_14px_-4px_rgba(196,30,58,0.6)]"
                />
              )}
              LEVEL {lv} ({count})
            </button>
          );
        })}
      </div>

      {/* members */}
      {isLoading ? (
        <div className="kv-card h-20 animate-pulse" />
      ) : !members || members.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="kv-card flex flex-col items-center justify-center px-6 py-10 text-center"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="mb-3 text-3xl"
            aria-hidden
          >
            👥
          </motion.div>
          <p className="text-sm font-semibold text-[#c9cdd4]">
            No level {level} members
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#787d86]">
            Share your invite link to grow this level.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
          <AnimatePresence mode="popLayout">
            {members.map((m) => (
              <MemberRow key={m.id} m={m} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function CommissionChip({ level, rate }: { level: string; rate: number }) {
  return (
    <div className="rounded-xl border border-[rgba(212,175,55,0.18)] bg-[rgba(212,175,55,0.06)] py-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a8f98]">{level}</div>
      <div className="gold-text text-sm font-extrabold">{rate}%</div>
    </div>
  );
}

function MemberRow({ m }: { m: TeamMember }) {
  return (
    <motion.div
      layout
      variants={riseIn}
      exit={{ opacity: 0, scale: 0.96 }}
      className="kv-card flex items-center gap-3 p-3"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
          m.active
            ? "border-[rgba(212,175,55,0.45)] bg-[rgba(212,175,55,0.12)] text-[#e9cf6e]"
            : "border-[rgba(255,255,255,0.1)] bg-[#1d1e24] text-[#8a8f98]"
        }`}
      >
        {m.displayName.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-white">{m.displayName}</span>
          <span className="shrink-0 text-[9px] text-[#787d86]">ID {m.id}</span>
        </div>
        <div className="mt-0.5 text-[10px] text-[#787d86]">
          Joined {new Date(m.joinedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>
      <div
        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
          m.active
            ? "border-[rgba(0,200,83,0.35)] bg-[rgba(0,200,83,0.1)] text-[#00c853]"
            : "border-[rgba(255,255,255,0.08)] bg-[#1d1e24] text-[#787d86]"
        }`}
      >
        {m.active ? "ACTIVE" : "IDLE"}
      </div>
    </motion.div>
  );
}
