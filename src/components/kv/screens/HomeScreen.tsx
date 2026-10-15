"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { GoldDiamond, GoldLabel } from "@/components/kv/shared/ui";
import { useSession } from "@/components/kv/AppShell";
import { stagger, riseIn } from "@/components/kv/shared/ui";

const QUICK_ACTIONS: {
  label: string;
  icon: React.ReactNode;
  action: "withdraw" | "recharge" | "bonus" | "influencer" | "records" | "about";
  external?: string;
}[] = [
  {
    label: "Recharge",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="13" rx="2.5" />
        <path d="M2 10.5h20" />
        <path d="M6.5 15.5h3" />
        <path d="M16.5 6 15 3.5h-3" />
      </svg>
    ),
    action: "recharge",
  },
  {
    label: "Withdraw",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v10" />
        <path d="m8 9.5 4 4 4-4" />
        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      </svg>
    ),
    action: "withdraw",
  },
  {
    label: "Bonus",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
      </svg>
    ),
    action: "bonus",
  },
  {
    label: "Influencer",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4Z" />
      </svg>
    ),
    action: "influencer",
  },
  {
    label: "Records",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
        <path d="M12 8v8" />
        <path d="M9 11h6" />
        <path d="M9 14.5h6" />
      </svg>
    ),
    action: "records",
  },
  {
    label: "About",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
    action: "about",
  },
  {
    label: "WhatsApp",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8Z" />
      </svg>
    ),
    action: "about",
    external: "https://wa.me/254745978024",
  },
  {
    label: "Telegram",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
    action: "about",
    external: "https://t.me/keshvault",
  },
];

const EVENTS = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e9cf6e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    title: "Top Earner Rewards",
    desc: "Climb the weekly leaderboard and share KES 40,000 in weekly bonuses.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e9cf6e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Community Meetup",
    desc: "Nairobi · Monthly community meetup — details announced in-app.",
  },
];

export function HomeScreen() {
  const { pushSub, openModal } = useAppStore();
  const { data: session } = useSession();
  const firstName = session?.user?.displayName ?? "member";

  function handleQuick(a: (typeof QUICK_ACTIONS)[number]) {
    if (a.external) {
      window.open(a.external, "_blank", "noopener,noreferrer");
      return;
    }
    if (a.action === "about") {
      openModal("about");
      return;
    }
    if (a.action === "bonus" || a.action === "influencer" || a.action === "records") {
      pushSub(a.action);
      return;
    }
    pushSub(a.action);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* brand header */}
      <motion.div variants={riseIn} className="flex items-center justify-center gap-2.5 pt-2">
        <GoldDiamond size={20} />
        <span className="gold-text text-lg font-extrabold tracking-[0.3em]">KESHVAULT</span>
      </motion.div>

      {/* hero banner */}
      <motion.a
        variants={riseIn}
        whileTap={{ scale: 0.985 }}
        onClick={() => pushSub("recharge")}
        className="kv-hero block cursor-pointer p-6"
        aria-label="Member rewards — grow your earnings"
      >
        <GoldLabel>Member Rewards</GoldLabel>
        <h2 className="mt-2 text-[28px] font-extrabold leading-[1.08] tracking-tight text-white">
          GROW YOUR
          <br />
          EARNINGS
        </h2>
        <p className="mt-2 text-sm font-normal text-[#e8d9d9]/80">Welcome back, {firstName}</p>
        <div className="mt-4 flex items-center gap-2">
          {["Products", "Team", "Wallet"].map((t) => (
            <span key={t}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e9cf6e]">
                {t}
              </span>
              {t !== "Wallet" && <span className="ml-2 text-[#e9cf6e]/50">·</span>}
            </span>
          ))}
        </div>
      </motion.a>

      {/* quick action grid */}
      <motion.div variants={riseIn} className="grid grid-cols-4 gap-2.5">
        {QUICK_ACTIONS.map((a) => (
          <motion.button
            key={a.label}
            onClick={() => handleQuick(a)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-[rgba(212,175,55,0.22)] bg-[linear-gradient(180deg,#1a1b21_0%,#141519_100%)] px-1 py-3 text-[#d4af37] shadow-[0_4px_16px_-8px_rgba(0,0,0,0.8)]"
            aria-label={a.label}
          >
            {a.icon}
            <span className="text-[10px] font-medium text-[#a7abb3]">{a.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* security banner */}
      <motion.div
        variants={riseIn}
        className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141519] px-4 py-3"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <p className="text-xs leading-relaxed text-[#a7abb3]">
          Keep your PIN private. KeshVault will never ask for it.
        </p>
      </motion.div>

      {/* events */}
      <motion.div variants={riseIn}>
        <GoldLabel className="mb-2.5 block">Events</GoldLabel>
        <div className="space-y-2.5">
          {EVENTS.map((e) => (
            <motion.div
              key={e.title}
              whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="kv-card flex items-center gap-4 p-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.09)] border border-[rgba(212,175,55,0.2)]">
                {e.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white">{e.title}</h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#8a8f98]">{e.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* footer */}
      <motion.p variants={riseIn} className="pt-1 pb-2 text-center text-[10px] tracking-wide text-[#4d525a]">
        KeshVault · Secure M-Pesa deposits and withdrawals.
      </motion.p>
    </motion.div>
  );
}
