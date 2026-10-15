"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { formatKES, PackageDTO } from "@/lib/api";

export function PurchaseSheet({
  pkg,
  balance,
  purchasing,
  onClose,
  onConfirm,
}: {
  pkg: PackageDTO | null;
  balance: number;
  purchasing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const affordable = pkg ? balance >= pkg.stake : false;

  return (
    <Drawer.Root open={!!pkg} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {pkg && (
          <Drawer.Portal forceMount>
            <Drawer.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
            </Drawer.Overlay>
            <Drawer.Content asChild>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border-t border-[rgba(212,175,55,0.3)] bg-[#131418] outline-none"
              >
                <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#33343a]" />
                <div className="px-5 pb-8 pt-2">
                  <Drawer.Title className="text-center text-base font-bold text-white">
                    Confirm activation
                  </Drawer.Title>

                  <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-[rgba(212,175,55,0.15)] bg-[#17181d] p-3.5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[rgba(212,175,55,0.3)]">
                      <Image src={pkg.image} alt={pkg.name} fill sizes="64px" className="object-cover" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{pkg.name}</h3>
                      <p className="mt-0.5 text-[11px] text-[#8a8f98]">
                        {pkg.durationDays} days · {formatKES(pkg.dailyReturn)} daily
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#141519] p-4 text-[13px]">
                    <Row label="Stake (deducted)" value={formatKES(pkg.stake)} valueClass="text-white" />
                    <Row
                      label="Daily earnings"
                      value={formatKES(pkg.dailyReturn)}
                      valueClass="text-[#e53935]"
                    />
                    <Row
                      label="Total return"
                      value={formatKES(pkg.totalReturn)}
                      valueClass="text-[#00c853]"
                    />
                    <Row label="Duration" value={`${pkg.durationDays} days`} valueClass="text-white" />
                    <Row label="Purchase limit" value={`×${pkg.limitPerUser}`} valueClass="text-[#e9cf6e]" />
                    <div className="border-t border-[rgba(255,255,255,0.06)] pt-2">
                      <Row
                        label="Wallet balance"
                        value={formatKES(balance)}
                        valueClass={affordable ? "text-[#00c853]" : "text-[#ff8a80]"}
                      />
                    </div>
                  </div>

                  {!affordable && (
                    <p className="mt-3 rounded-xl border border-[rgba(229,57,53,0.3)] bg-[rgba(229,57,53,0.08)] px-3.5 py-2.5 text-center text-xs text-[#ff8a80]">
                      Insufficient balance — recharge your wallet first.
                    </p>
                  )}

                  <div className="mt-5 space-y-2.5">
                    <motion.button
                      whileTap={affordable && !purchasing ? { scale: 0.97 } : undefined}
                      disabled={!affordable || purchasing}
                      onClick={onConfirm}
                      className="btn-crimson w-full py-3.5 text-sm font-extrabold tracking-wide"
                    >
                      {purchasing ? "Activating…" : `ACTIVATE · ${formatKES(pkg.stake, 0)}`}
                    </motion.button>
                    <button
                      onClick={onClose}
                      className="btn-gold-outline w-full py-3 text-sm font-bold"
                    >
                      Not now
                    </button>
                  </div>

                  <p className="mt-3 text-center text-[10px] leading-relaxed text-[#6b7078]">
                    Daily earnings are credited automatically to your wallet every 24 hours.
                    <br />
                    Package stakes are deducted immediately on activation.
                  </p>
                </div>
              </motion.div>
            </Drawer.Content>
          </Drawer.Portal>
        )}
      </AnimatePresence>
    </Drawer.Root>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#8a8f98]">{label}</span>
      <span className={`font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}
