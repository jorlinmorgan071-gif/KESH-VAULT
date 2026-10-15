"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, GoldLabel } from "@/components/kv/shared/ui";
import { useSession } from "@/components/kv/AppShell";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function WithdrawAccountScreen() {
  const { popSub } = useAppStore();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const registered = session?.user?.mpesaPhone ?? "";

  useEffect(() => {
    if (registered && !phone) setPhone(registered);
  }, [registered]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const r = await api.updateWithdrawAccount(phone);
      toast({ title: "Withdraw account updated", description: `M-Pesa: ${r.mpesaPhone}` });
    } catch (e) {
      toast({
        title: "Invalid number",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SubPageHeader title="Withdraw Account" onBack={popSub} />

      <div className="kv-card p-5">
        <GoldLabel>Registered M-Pesa Number</GoldLabel>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(212,175,55,0.45)] bg-[rgba(212,175,55,0.08)] text-[#d4af37]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            inputMode="tel"
            className="field min-w-0 flex-1 px-4 py-3 text-sm font-bold"
            maxLength={13}
          />
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-[#787d86]">
          Withdrawals are sent to this registered M-Pesa number only. Kenyan Safaricom
          numbers (07XX / 01XX). {registered ? `Currently registered: ${registered}` : "No number registered yet."}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={saving || !phone.trim()}
          onClick={handleSave}
          className="btn-crimson mt-4 w-full py-3.5 text-sm font-extrabold tracking-wide"
        >
          {saving ? "Saving…" : "SAVE NUMBER"}
        </motion.button>
      </div>

      <div className="mt-4 kv-card p-5">
        <GoldLabel>Withdrawal Rules</GoldLabel>
        <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-[#a7abb3]">
          <li className="flex gap-2.5">
            <span className="text-[#d4af37]">◆</span>
            Minimum withdrawal KES 250 · maximum KES 25,000 per transaction
          </li>
          <li className="flex gap-2.5">
            <span className="text-[#d4af37]">◆</span>
            Transaction fee: 16% per withdrawal
          </li>
          <li className="flex gap-2.5">
            <span className="text-[#d4af37]">◆</span>
            Unlimited daily withdrawals while the window is open
          </li>
          <li className="flex gap-2.5">
            <span className="text-[#d4af37]">◆</span>
            Window: 9:00 AM – 7:00 PM EAT · deposits remain 24/7
          </li>
          <li className="flex gap-2.5">
            <span className="text-[#d4af37]">◆</span>
            Processed automatically within 0–12 hours
          </li>
        </ul>
      </div>
    </div>
  );
}
