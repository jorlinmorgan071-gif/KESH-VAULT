"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useSession } from "@/components/kv/AppShell";
import {
  stagger,
  riseIn,
  GoldLabel,
  MoneyTicker,
  StatTile,
} from "@/components/kv/shared/ui";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const MENU: { label: string; icon: React.ReactNode; view: "withdraw-account" | "records" | "coupon" | "reset-password" | "guide" }[] = [
  {
    label: "Withdraw Account",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2.5" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
    view: "withdraw-account",
  },
  {
    label: "Records",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
        <path d="M12 8v8M9 11h6M9 14.5h6" />
      </svg>
    ),
    view: "records",
  },
  {
    label: "My Coupon",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5a2 2 0 0 1 0 4v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a2 2 0 0 1 0-4Z" />
        <path d="M12 8v8" strokeDasharray="2 2.5" />
      </svg>
    ),
    view: "coupon",
  },
  {
    label: "Reset Password",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 20a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z" />
        <path d="M11.5 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="m14 12 6-4" />
      </svg>
    ),
    view: "reset-password",
  },
  {
    label: "Replay guide",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 12 5 5" />
        <path d="M2 12a10 10 0 1 0 3-7" />
        <path d="M2 4v5h5" />
      </svg>
    ),
    view: "guide",
  },
];

export function MineScreen() {
  const { pushSub, openModal } = useAppStore();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const user = session?.user;
  const stats = session?.stats;

  async function handleLogout() {
    try {
      await api.logout();
      queryClient.clear();
      toast({ title: "Signed out", description: "Your vault is sealed. Come back soon." });
      window.location.reload();
    } catch {
      toast({ title: "Could not sign out", variant: "destructive" });
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="pt-2">
      {/* header */}
      <motion.div variants={riseIn} className="flex items-center gap-3.5">
        <motion.div
          whileHover={{ scale: 1.04 }}
          className="glow-gold flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[rgba(212,175,55,0.55)] bg-[linear-gradient(160deg,rgba(212,175,55,0.28),rgba(120,90,20,0.2))] text-2xl font-extrabold text-[#f5d873]"
        >
          {(user?.displayName ?? "M").slice(0, 1).toUpperCase()}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-lg font-extrabold text-white">
              {user?.displayName ?? "member"}
            </span>
            <span className="pill-gold px-2 py-0.5 text-[9px] font-extrabold tracking-[0.14em]">LVL1</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-[#8a8f98]">ID {user?.shortId ?? "········"}</span>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(user?.id ?? "")
                  .then(() => toast({ title: "User ID copied" }))
                  .catch(() => {});
              }}
              className="text-[#787d86] transition-colors hover:text-[#d4af37]"
              aria-label="Copy user ID"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            navigator.clipboard
              .writeText(user ? `${user.displayName} · ID ${user.shortId} · KeshVault` : "")
              .then(() => toast({ title: "Profile copied" }))
              .catch(() => {});
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1b20] text-[#8a8f98]"
          aria-label="Share profile"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="m16 6-4-4-4 4" />
            <path d="M12 2v13" />
          </svg>
        </motion.button>
      </motion.div>

      {/* balance card */}
      <motion.div variants={riseIn} className="kv-card-gold mt-5 p-5">
        <GoldLabel>Available Balance</GoldLabel>
        <MoneyTicker
          value={user?.balance ?? 0}
          className="mt-1.5 block text-3xl font-extrabold tracking-tight text-white"
        />
        <div className="mt-4 flex gap-2.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            onClick={() => pushSub("recharge")}
            className="btn-gold-outline flex-1 py-3 text-xs font-extrabold tracking-wide"
          >
            RECHARGE
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            onClick={() => pushSub("withdraw")}
            className="btn-crimson flex-1 py-3 text-xs font-extrabold tracking-wide"
          >
            WITHDRAW
          </motion.button>
        </div>
      </motion.div>

      {/* KPI row */}
      <motion.div variants={riseIn} className="mt-3.5 flex gap-2.5">
        <StatTile label="Today" value={stats?.todayEarnings ?? 0} money accent="green" />
        <StatTile label="Active Team" value={stats?.activeTeam ?? 0} accent="gold" />
        <StatTile label="Invite Income" value={stats?.inviteIncome ?? 0} money accent="green" />
      </motion.div>

      {/* menu */}
      <motion.div variants={riseIn} className="mt-5 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141519]">
        {MENU.map((item, i) => (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.99, backgroundColor: "rgba(212,175,55,0.05)" }}
            onClick={() =>
              item.view === "guide" ? openModal("howitworks") : pushSub(item.view)
            }
            className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left ${
              i > 0 ? "border-t border-[rgba(255,255,255,0.05)]" : ""
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.08)] text-[#d4af37]">
              {item.icon}
            </span>
            <span className="flex-1 text-sm font-semibold text-[#e8e6e3]">{item.label}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5d626b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </motion.button>
        ))}
      </motion.div>

      {/* community */}
      <motion.div variants={riseIn} className="mt-5">
        <GoldLabel className="mb-2.5 block">Community</GoldLabel>
        <div className="flex gap-2.5">
          <motion.a
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            href="https://wa.me/254745978024"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold-outline flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8Z" />
            </svg>
            WhatsApp
          </motion.a>
          <motion.a
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -1 }}
            href="https://t.me/keshvault"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold-outline flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Telegram
          </motion.a>
        </div>
      </motion.div>

      {/* sign out */}
      <motion.button
        variants={riseIn}
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        className="mt-5 w-full rounded-full border border-[rgba(229,57,53,0.35)] bg-[rgba(229,57,53,0.06)] py-3 text-xs font-bold text-[#ff8a80] transition-colors hover:bg-[rgba(229,57,53,0.12)]"
      >
        Sign out
      </motion.button>

      <p className="mt-5 pb-2 text-center text-[10px] tracking-wide text-[#4d525a]">
        Member since{" "}
        {user
          ? new Date(user.createdAt).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "—"}
      </p>
    </motion.div>
  );
}
