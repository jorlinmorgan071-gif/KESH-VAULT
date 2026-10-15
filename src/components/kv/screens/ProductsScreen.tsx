"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, formatKES, PackageDTO } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { stagger, riseIn, GoldLabel } from "@/components/kv/shared/ui";
import { useSession } from "@/components/kv/AppShell";
import { PurchaseSheet } from "@/components/kv/modals/PurchaseSheet";
import { useToast } from "@/hooks/use-toast";

export function ProductsScreen() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<PackageDTO | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: api.packages,
  });

  const balance = session?.user?.balance ?? 0;

  async function handlePurchase(pkg: PackageDTO) {
    setPurchasing(true);
    try {
      await api.purchase(pkg.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["session"] }),
        queryClient.invalidateQueries({ queryKey: ["packages"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["records"] }),
      ]);
      toast({
        title: "Package activated 🚗",
        description: `${pkg.name} · ${formatKES(pkg.dailyReturn)} daily for ${pkg.durationDays} days.`,
      });
      setSelected(null);
    } catch (e) {
      toast({
        title: "Could not activate package",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div className="pt-2">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Products</h1>
          <p className="mt-0.5 text-[11px] text-[#8a8f98]">
            Wallet balance: <span className="font-semibold text-[#e9cf6e]">{formatKES(balance)}</span>
          </p>
        </div>
        <GoldLabel>7 Luxury Tiers</GoldLabel>
      </div>

      {isLoading ? (
        <PackageSkeletons />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {(data?.packages ?? []).map((pkg) => {
            const atLimit = pkg.ownedCount >= pkg.limitPerUser;
            return (
              <motion.article
                key={pkg.id}
                variants={riseIn}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="kv-card overflow-hidden"
              >
                <div className="flex gap-3.5 p-3.5">
                  <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl border border-[rgba(212,175,55,0.3)]">
                    <Image
                      src={pkg.image}
                      alt={`${pkg.name} package`}
                      fill
                      sizes="92px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-[#e9cf6e] backdrop-blur-sm">
                      {pkg.durationDays}D
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-extrabold leading-tight tracking-wide text-white">
                        {pkg.name}
                      </h3>
                      {pkg.ownedCount > 0 && (
                        <span className="pill-gold shrink-0 px-2 py-0.5 text-[9px] font-bold">
                          {pkg.ownedCount}/{pkg.limitPerUser}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a8f98]">
                        Daily
                      </span>
                      <span className="text-lg font-extrabold text-[#e53935]">
                        {formatKES(pkg.dailyReturn)}
                      </span>
                    </div>

                    <div className="mt-auto grid grid-cols-3 gap-1 pt-2">
                      <div>
                        <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#787d86]">
                          Stake
                        </div>
                        <div className="text-[11px] font-bold text-white">
                          {formatKES(pkg.stake, 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#787d86]">
                          Total Return
                        </div>
                        <div className="text-[11px] font-bold text-[#00c853]">
                          {formatKES(pkg.totalReturn, 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#787d86]">
                          Limit
                        </div>
                        <div className="text-[11px] font-bold text-[#e9cf6e]">×{pkg.limitPerUser}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-3.5 pb-3.5">
                  <motion.button
                    whileTap={atLimit ? undefined : { scale: 0.97 }}
                    whileHover={atLimit ? undefined : { y: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    disabled={atLimit}
                    onClick={() => setSelected(pkg)}
                    className={`btn-crimson w-full py-3 text-[13px] font-extrabold tracking-wide ${
                      atLimit ? "opacity-60" : ""
                    }`}
                  >
                    {atLimit ? `LIMIT REACHED · ×${pkg.limitPerUser}` : "GET PACKAGE"}
                  </motion.button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      <PurchaseSheet
        pkg={selected}
        balance={balance}
        purchasing={purchasing}
        onClose={() => setSelected(null)}
        onConfirm={() => selected && handlePurchase(selected)}
      />
    </div>
  );
}

function PackageSkeletons() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="kv-card overflow-hidden p-3.5">
          <div className="flex gap-3.5">
            <div className="h-[92px] w-[92px] shrink-0 animate-pulse rounded-xl bg-[#1f2026]" />
            <div className="flex-1 space-y-2.5 py-1">
              <div className="h-3.5 w-3/5 animate-pulse rounded bg-[#1f2026]" />
              <div className="h-6 w-2/5 animate-pulse rounded bg-[#24252b]" />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="h-7 animate-pulse rounded bg-[#1f2026]" />
                <div className="h-7 animate-pulse rounded bg-[#1f2026]" />
                <div className="h-7 animate-pulse rounded bg-[#1f2026]" />
              </div>
            </div>
          </div>
          <div className="mt-3.5 h-11 animate-pulse rounded-full bg-[#24252b]" />
        </div>
      ))}
    </div>
  );
}
