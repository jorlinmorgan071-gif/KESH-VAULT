"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, formatKES, formatTime, OrderDTO, TransactionDTO } from "@/lib/api";
import { stagger, riseIn, GoldLabel, StatusPill, TypeIcon, MoneyTicker } from "@/components/kv/shared/ui";
import { useSession } from "@/components/kv/AppShell";

export function IncomeScreen() {
  const [tab, setTab] = useState<"valid" | "expired">("valid");
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: api.orders,
    refetchInterval: 30_000,
  });

  const orders = data?.orders ?? [];
  const validCount = orders.filter((o) => o.status === "ACTIVE").length;
  const expiredCount = orders.filter((o) => o.status === "EXPIRED").length;
  const filtered = orders.filter((o) => (tab === "valid" ? o.status === "ACTIVE" : o.status === "EXPIRED"));

  const todayEarnings = session?.stats?.todayEarnings ?? 0;

  return (
    <div className="pt-2">
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-xl font-extrabold text-white">Income</h1>
        <GoldLabel>
          Today · <span className="text-[#00c853]">{formatKES(todayEarnings)}</span>
        </GoldLabel>
      </div>

      {/* tabs */}
      <div className="relative mb-4 grid grid-cols-2 rounded-full border border-[rgba(255,255,255,0.07)] bg-[#141519] p-1">
        {(["valid", "expired"] as const).map((key) => {
          const active = tab === key;
          const label = key === "valid" ? `VALID (${validCount})` : `EXPIRED (${expiredCount})`;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative z-10 rounded-full py-2 text-[11px] font-bold tracking-wide transition-colors ${
                active ? "text-white" : "text-[#787d86]"
              }`}
              aria-pressed={active}
            >
              {active && (
                <motion.span
                  layoutId="income-tab"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-[#e0293f] to-[#a3172d] shadow-[0_4px_14px_-4px_rgba(196,30,58,0.6)]"
                />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="kv-card h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tab === "valid" ? "No active orders" : "No expired orders"}
          desc={
            tab === "valid"
              ? "Products appear here while they earn."
              : "Completed packages will be listed here."
          }
        />
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* earning history */}
      <div className="mt-7">
        <GoldLabel className="mb-2.5 block">Earning History</GoldLabel>
        {(data?.history ?? []).length === 0 ? (
          <EmptyState small title="Nothing yet" desc="Daily earnings, commissions and bonuses land here." />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {(data?.history ?? []).map((t) => (
              <HistoryRow key={t.id} t={t} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderDTO }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="kv-card overflow-hidden p-3.5"
    >
      <div className="flex gap-3.5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[rgba(212,175,55,0.25)]">
          <Image src={order.packageImage} alt={order.packageName} fill sizes="64px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[13px] font-extrabold text-white">{order.packageName}</h3>
            <StatusPill status={order.status === "ACTIVE" ? "COMPLETED" : "EXPIRED"} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#787d86]">Daily</span>
            <span className="text-base font-extrabold text-[#e53935]">{formatKES(order.dailyReturn)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#8a8f98]">
            <span>
              Paid out <span className="font-bold text-[#00c853]">{formatKES(order.totalPaidOut)}</span>
            </span>
            <span>
              {order.remainingDays > 0
                ? `${order.remainingDays} day${order.remainingDays > 1 ? "s" : ""} left`
                : "Completed"}
            </span>
          </div>
        </div>
      </div>

      {/* progress */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-[#787d86]">
          <span>Progress</span>
          <span className="text-[#e9cf6e]">{order.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#22232a]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${order.progress}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.15 }}
            className="h-full rounded-full bg-gradient-to-r from-[#c9a227] via-[#d4af37] to-[#f0d060]"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#141519] py-2.5 text-center">
        <MiniStat label="Earned" value={formatKES(order.totalPaidOut)} valueClass="text-[#00c853]" />
        <MiniStat label="To come" value={formatKES(order.dailyToCome)} valueClass="text-[#e9cf6e]" />
        <MiniStat label="Total" value={formatKES(order.totalReturn)} valueClass="text-white" />
      </div>
    </motion.article>
  );
}

function MiniStat({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div>
      <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#787d86]">{label}</div>
      <div className={`mt-0.5 text-[11px] font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function HistoryRow({ t }: { t: TransactionDTO }) {
  return (
    <motion.div
      variants={riseIn}
      className="kv-card flex items-center gap-3 p-3"
    >
      <TypeIcon type={t.type} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-white">{t.description}</div>
        <div className="mt-0.5 text-[10px] text-[#787d86]">{formatTime(t.createdAt)}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-extrabold text-[#00c853]">
          +{formatKES(t.amount)}
        </div>
        <div className="mt-0.5 text-[9px] font-semibold tracking-wide text-[#787d86]">{t.type}</div>
      </div>
    </motion.div>
  );
}

function EmptyState({ title, desc, small }: { title: string; desc: string; small?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`kv-card flex flex-col items-center justify-center text-center ${small ? "px-4 py-6" : "px-6 py-10"}`}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="mb-3 text-3xl"
        aria-hidden
      >
        📈
      </motion.div>
      <p className="text-sm font-semibold text-[#c9cdd4]">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#787d86]">{desc}</p>
    </motion.div>
  );
}
