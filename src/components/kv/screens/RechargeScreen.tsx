"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, formatKES } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, GoldLabel, MoneyTicker } from "@/components/kv/shared/ui";
import { useToast } from "@/hooks/use-toast";

const QUICK = [500, 1200, 2000, 3500, 6000, 12000];
const MIN = 50;
const MAX = 150000;

type Stage = "form" | "processing" | "success";

export function RechargeScreen() {
  const { popSub } = useAppStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [credited, setCredited] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useQuery({ queryKey: ["session"], queryFn: api.session });
  const balance = session?.user?.balance ?? 0;
  const defaultPhone = session?.user?.mpesaPhone || session?.user?.phone || "";

  const amt = typeof amount === "number" ? amount : 0;
  const validAmount = amt >= MIN && amt <= MAX;
  const phoneDigits = phone.replace(/\D/g, "");
  const validPhone = /^(07|01)\d{8}$/.test(phoneDigits) || phoneDigits.startsWith("254");

  function startRecharge() {
    setError(null);
    if (!validAmount) {
      setError(`Enter an amount between KES ${MIN} and KES ${MAX.toLocaleString()}.`);
      return;
    }
    setStage("processing");

    // Airtel Money gateway handshake — the member confirms the PIN prompt
    // on their handset; funds arrive automatically on confirmation.
    setTimeout(async () => {
      try {
        const result = await api.recharge({ amount: amt, phone: phoneDigits || defaultPhone });
        await queryClient.invalidateQueries({ queryKey: ["session"] });
        await queryClient.invalidateQueries({ queryKey: ["records"] });
        setCredited(result.credited);
        setStage("success");
        toast({
          title: "Wallet recharged ⚡",
          description: `${formatKES(result.credited)} credited via Airtel Money.`,
        });
      } catch (e) {
        setStage("form");
        setError(e instanceof Error ? e.message : "Recharge failed.");
      }
    }, 2600);
  }

  return (
    <div>
      <SubPageHeader title="Recharge" onBack={popSub} />

      {/* balance */}
      <div className="kv-card p-5">
        <GoldLabel>Available Balance</GoldLabel>
        <MoneyTicker value={balance} className="mt-1 block text-2xl font-extrabold text-white" />
      </div>

      <AnimatePresence mode="wait">
        {stage === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            {/* gateway banner */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[rgba(229,57,53,0.3)] bg-[linear-gradient(160deg,rgba(229,57,53,0.12),rgba(196,30,58,0.04))] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(229,57,53,0.5)] text-lg font-extrabold text-[#ff6b6b]">
                a
              </div>
              <div>
                <p className="text-sm font-bold text-white">Airtel Money</p>
                <p className="text-[10px] text-[#8a8f98]">Deposits are open 24/7 · credited instantly</p>
              </div>
            </div>

            {/* quick amounts */}
            <div className="mt-4">
              <GoldLabel className="mb-2 block">Quick Amounts</GoldLabel>
              <div className="grid grid-cols-3 gap-2">
                {QUICK.map((q) => {
                  const active = amount === q;
                  return (
                    <motion.button
                      key={q}
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      onClick={() => setAmount(q)}
                      className={`rounded-xl border py-3 text-xs font-bold transition-colors ${
                        active
                          ? "border-[#d4af37] bg-[rgba(212,175,55,0.12)] text-[#e9cf6e] shadow-[0_0_16px_-4px_rgba(212,175,55,0.5)]"
                          : "border-[rgba(255,255,255,0.08)] bg-[#141519] text-[#c9cdd4]"
                      }`}
                    >
                      KES {q.toLocaleString()}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* amount */}
            <div className="mt-4">
              <GoldLabel className="mb-2 block">Or Enter Amount</GoldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#d4af37]">
                  KES
                </span>
                <input
                  type="number"
                  value={amount === "" ? "" : amount}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAmount(v === "" ? "" : Math.max(0, Number(v)));
                  }}
                  placeholder={`${MIN} – ${MAX.toLocaleString()}`}
                  inputMode="numeric"
                  className="field w-full py-3.5 pl-16 pr-4 text-lg font-bold tracking-wide"
                />
              </div>
            </div>

            {/* phone */}
            <div className="mt-4">
              <GoldLabel className="mb-2 block">Airtel Money Number</GoldLabel>
              <input
                value={phone || defaultPhone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                inputMode="tel"
                className="field w-full px-4 py-3.5 text-sm"
                maxLength={13}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 rounded-lg border border-[rgba(229,57,53,0.3)] bg-[rgba(229,57,53,0.08)] px-3 py-2 text-center text-xs text-[#ff8a80]"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={validAmount ? { scale: 0.97 } : undefined}
              disabled={!validAmount}
              onClick={startRecharge}
              className="btn-crimson mt-5 w-full py-3.5 text-sm font-extrabold tracking-wide"
            >
              {validAmount ? `RECHARGE ${formatKES(amt, 0)}` : "ENTER AMOUNT"}
            </motion.button>

            <p className="mt-3 text-center text-[10px] leading-relaxed text-[#787d86]">
              You will receive an Airtel Money PIN prompt on your phone.
              <br />
              Confirm with your PIN to complete the deposit. Min KES 50.
            </p>
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-6 flex flex-col items-center rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[#141519] px-6 py-10 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[rgba(212,175,55,0.3)] border-t-[#d4af37]"
            />
            <p className="text-sm font-bold text-white">Confirming with Airtel Money…</p>
            <p className="mt-1.5 text-[11px] text-[#8a8f98]">
              Enter your PIN on the prompt sent to {phoneDigits || defaultPhone}
            </p>
            <div className="mt-4 w-full overflow-hidden rounded-full bg-[#22232a]">
              <motion.div
                initial={{ width: "5%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.4, ease: "easeInOut" }}
                className="h-1.5 rounded-full bg-gradient-to-r from-[#c9a227] to-[#f0d060]"
              />
            </div>
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="mt-6 flex flex-col items-center rounded-2xl border border-[rgba(0,200,83,0.3)] bg-[linear-gradient(180deg,rgba(0,200,83,0.07),transparent)] px-6 py-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[rgba(0,200,83,0.5)] bg-[rgba(0,200,83,0.1)] text-2xl"
            >
              ✅
            </motion.div>
            <p className="text-sm font-bold text-white">Recharge successful</p>
            <p className="mt-1.5 text-2xl font-extrabold text-[#00c853]">
              +{formatKES(credited)}
            </p>
            <p className="mt-1.5 text-[11px] text-[#8a8f98]">
              Credited to your KeshVault wallet
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setStage("form");
                setAmount("");
                setCredited(0);
              }}
              className="btn-gold-outline mt-6 w-full py-3 text-sm font-bold"
            >
              Recharge again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
