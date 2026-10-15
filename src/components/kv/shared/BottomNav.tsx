"use client";

import { motion } from "framer-motion";
import { useAppStore, TabKey } from "@/store/useAppStore";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "home",
    label: "Home",
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.8V21h5v-6h4v6h5V9.8" />
      </svg>
    ),
  },
  {
    key: "products",
    label: "Products",
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    key: "income",
    label: "Income",
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    ),
  },
  {
    key: "team",
    label: "Team",
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "mine",
    label: "Mine",
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const { tab, setTab, subView, popSub } = useAppStore();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(212,175,55,0.1)] bg-[#0d0d10]/92 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-1.5 pt-2">
        {TABS.map((t) => {
          const active = tab === t.key && !subView;
          return (
            <motion.button
              key={t.key}
              onClick={() => {
                if (subView) popSub();
                setTab(t.key);
              }}
              whileTap={{ scale: 0.9 }}
              className="relative flex min-w-[56px] flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5"
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="tab-glow"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute -top-0.5 h-1 w-8 rounded-full bg-gradient-to-r from-[#e53935] to-[#c41e3a]"
                  style={{ boxShadow: "0 0 12px rgba(229,57,53,0.8)" }}
                />
              )}
              <motion.div
                animate={{
                  color: active ? "#e53935" : "#787d86",
                  y: active ? -1 : 0,
                  scale: active ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {t.icon}
              </motion.div>
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  active ? "text-[#e53935]" : "text-[#787d86]"
                }`}
              >
                {t.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
