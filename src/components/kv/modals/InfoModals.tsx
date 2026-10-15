"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { GoldDiamond } from "@/components/kv/shared/ui";

/**
 * Welcome modal — the complete KeshVault rule set, shown on first login.
 */
export function WelcomeModal() {
  const { modal, closeModal } = useAppStore();
  const queryClient = useQueryClient();
  const open = modal === "welcome";

  const RULES = [
    { text: "Sign-up bonus: KES 100", strong: true },
    { text: "Minimum investment: 1,200 KES", strong: true },
    { text: "Minimum withdrawal: 250 KES", strong: true },
    { text: "Transaction fee: 16%", strong: true },
    { text: "Referral rewards: 12% + 5% + 3%", strong: true },
    { text: "Unlimited daily withdrawals", strong: false },
    { text: "Withdrawals are processed automatically within 0-12 hours", strong: true },
    { text: "Gift codes are released daily at 5:00 PM", strong: true, gold: true },
    { text: "Team task rewards up to 60,000 KES", strong: false },
  ];

  function handleClose() {
    api.preferences({ welcomeSeen: true }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["session"] });
    closeModal();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to KeshVault"
        >
          <motion.div
            initial={{ scale: 0.88, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="kv-card-gold relative w-full max-w-sm p-6"
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-[#8a8f98] transition-colors hover:text-white"
              aria-label="Close"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <GoldDiamond size={26} />
              <h2 className="mt-2.5 text-xl font-extrabold text-white">
                Welcome to <span className="gold-text">KESH VAULT</span>
              </h2>
            </div>

            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } }}
              className="mt-5 space-y-2.5"
            >
              {RULES.map((r, i) => (
                <motion.li
                  key={i}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
                  }}
                  className={`flex items-start gap-2.5 text-[12.5px] leading-relaxed ${
                    r.gold ? "text-[#e9cf6e]" : r.strong ? "font-semibold text-white" : "text-[#a7abb3]"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-[10px] text-[#d4af37]">◆</span>
                  {r.text}
                </motion.li>
              ))}
            </motion.ul>

            <motion.a
              whileTap={{ scale: 0.97 }}
              href="https://wa.me/254745978024"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="btn-crimson mt-6 block w-full py-3.5 text-center text-sm font-extrabold tracking-wide"
            >
              Official group
            </motion.a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * How KeshVault works — 3-step guide. First visit + replay via Mine menu.
 */
export function HowItWorksModal() {
  const { modal, closeModal } = useAppStore();
  const queryClient = useQueryClient();
  const open = modal === "howitworks";

  const STEPS = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="13" rx="2.5" />
          <path d="M2 10.5h20" />
          <path d="M6.5 15.5h3" />
          <path d="M16.5 6 15 3.5h-3" />
        </svg>
      ),
      title: "Recharge your wallet",
      desc: "Deposit via Airtel Money — open 24/7, credited instantly to your KeshVault wallet.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
      title: "Activate an earning package",
      desc: "Choose a luxury package from Products and start earning daily returns automatically.",
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      ),
      title: "Grow your earnings",
      desc: "Watch daily income under Income and invite teammates for 3-level commissions.",
    },
  ];

  function handleClose() {
    api.preferences({ guideSeen: true }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["session"] });
    closeModal();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="How KeshVault works"
        >
          <motion.div
            initial={{ scale: 0.88, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="kv-card relative w-full max-w-sm p-6"
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-[#8a8f98] transition-colors hover:text-white"
              aria-label="Close"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-center text-lg font-extrabold text-white">
              How <span className="gold-text">KeshVault</span> works
            </h2>

            <div className="mt-5 space-y-3">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.09, type: "spring", stiffness: 280, damping: 24 }}
                  className="flex items-start gap-3.5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141519] p-3.5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.08)]">
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold tracking-[0.2em] text-[#d4af37]">
                        STEP {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-[13px] font-bold text-white">{s.title}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#8a8f98]">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleClose}
              className="btn-crimson mt-5 w-full py-3.5 text-sm font-extrabold tracking-wide"
            >
              Got it
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * About modal — the product narrative anchor.
 */
export function AboutModal() {
  const { modal, closeModal } = useAppStore();
  const open = modal === "about";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="About KeshVault"
        >
          <motion.div
            initial={{ scale: 0.88, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="kv-card-gold relative w-full max-w-sm p-6 text-center"
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-[#8a8f98] transition-colors hover:text-white"
              aria-label="Close"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <GoldDiamond size={30} />
            <h2 className="mt-2.5 text-lg font-extrabold text-white">
              About <span className="gold-text">KeshVault</span>
            </h2>

            <p className="mt-3.5 text-[12.5px] leading-relaxed text-[#c9cdd4]">
              KeshVault is a rewards platform: activate earning packages, grow your team
              and track daily earnings. Deposits and withdrawals run through M-Pesa, and
              rewards are credited to your wallet automatically.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { v: "24/7", l: "Deposits" },
                { v: "0–12h", l: "Payouts" },
                { v: "12·5·3%", l: "Referrals" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.05)] py-2.5">
                  <div className="gold-text text-sm font-extrabold">{s.v}</div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a8f98]">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={closeModal}
              className="btn-gold-outline mt-5 w-full py-3 text-sm font-bold"
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
