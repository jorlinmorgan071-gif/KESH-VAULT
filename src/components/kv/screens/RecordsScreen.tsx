"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, formatKES, formatTime, TransactionDTO } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, StatusPill, TypeIcon } from "@/components/kv/shared/ui";

const TABS = [
  { key: "account", label: "ACCOUNT" },
  { key: "recharge", label: "RECHARGE" },
  { key: "withdraw", label: "WITHDRAW" },
] as const;

export function RecordsScreen() {
  const { popSub } = useAppStore();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("account");

  const { data, isLoading } = useQuery({
    queryKey: ["records", tab],
    queryFn: () => api.records(tab),
  });

  const records = data?.records ?? [];

  return (
    <div>
      <SubPageHeader title="Records" onBack={popSub} />

      {/* segmented control */}
      <div className="relative mb-4 grid grid-cols-3 rounded-full border border-[rgba(255,255,255,0.07)] bg-[#141519] p-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative z-10 rounded-full py-2 text-[11px] font-bold tracking-wide transition-colors ${
                active ? "text-white" : "text-[#787d86]"
              }`}
              aria-pressed={active}
            >
              {active && (
                <motion.span
                  layoutId="records-tab"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-[#e0293f] to-[#a3172d] shadow-[0_4px_14px_-4px_rgba(196,30,58,0.6)]"
                />
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="kv-card h-[74px] animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="kv-card flex flex-col items-center justify-center px-6 py-12 text-center"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="mb-3 text-3xl"
            aria-hidden
          >
            🧾
          </motion.div>
          <p className="text-sm font-semibold text-[#c9cdd4]">No {tab} records yet</p>
          <p className="mt-1 text-[11px] text-[#787d86]">Transactions will appear here.</p>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {records.map((r, i) => (
              <RecordCard key={r.id} r={r} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function RecordCard({ r, index }: { r: TransactionDTO; index: number }) {
  const positive = r.amount > 0;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index * 0.05, 0.4), type: "spring", stiffness: 280, damping: 26 } }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      className="kv-card p-3.5"
    >
      <div className="flex items-center gap-3">
        <TypeIcon type={r.type} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[13px] font-bold text-white">{r.description}</h3>
            <span className={`shrink-0 text-sm font-extrabold ${positive ? "text-[#00c853]" : "text-[#c9cdd4]"}`}>
              {positive ? "+" : "−"}{formatKES(Math.abs(r.amount))}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#787d86]">{formatTime(r.createdAt)}</span>
            <StatusPill status={r.status} />
          </div>
        </div>
      </div>
      <div className="mt-2.5 border-t border-[rgba(255,255,255,0.05)] pt-2 pl-[52px] text-[10px] font-mono tracking-wide text-[#5d626b]">
        {r.reference}
      </div>
    </motion.article>
  );
}
