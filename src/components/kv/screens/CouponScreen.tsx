"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api, formatKES, formatTime } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, GoldLabel } from "@/components/kv/shared/ui";

export function CouponScreen() {
  const { popSub } = useAppStore();
  const { data, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: api.coupons,
  });

  const coupons = data?.coupons ?? [];

  return (
    <div>
      <SubPageHeader title="My Coupon" onBack={popSub} />

      <div className="kv-card p-5">
        <GoldLabel>Vouchers</GoldLabel>
        <p className="mt-1.5 text-xs leading-relaxed text-[#8a8f98]">
          Gift codes you redeem appear here as vouchers with their value and status.
        </p>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="kv-card h-24 animate-pulse" />
        ) : coupons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="kv-card flex flex-col items-center justify-center px-6 py-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -5, 0], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mb-3 text-3xl"
              aria-hidden
            >
              🎟️
            </motion.div>
            <p className="text-sm font-semibold text-[#c9cdd4]">No coupons yet</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#787d86]">
              Vouchers will appear here when issued.
            </p>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="show" className="space-y-2.5">
            {coupons.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                className="kv-card-gold flex items-center gap-4 p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.1)] text-xl">
                  🎟️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold tracking-[0.14em] text-[#e9cf6e]">{c.code}</div>
                  <div className="mt-0.5 text-[10px] text-[#787d86]">{formatTime(c.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-[#00c853]">+{formatKES(c.amount)}</div>
                  <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#e9cf6e]">
                    {c.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
