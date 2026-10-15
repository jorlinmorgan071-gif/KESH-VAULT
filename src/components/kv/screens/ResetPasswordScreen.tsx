"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { SubPageHeader, GoldLabel } from "@/components/kv/shared/ui";
import { useToast } from "@/hooks/use-toast";

export function ResetPasswordScreen() {
  const { popSub } = useAppStore();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.resetPassword({ currentPassword, newPassword });
      toast({
        title: "Password updated",
        description: "Your new key to the vault is active.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SubPageHeader title="Reset Password" onBack={popSub} />

      <div className="kv-card p-5">
        <GoldLabel>Current Password</GoldLabel>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          className="field mt-2 w-full px-4 py-3.5 text-sm"
          autoComplete="current-password"
        />

        <div className="mt-4">
          <GoldLabel>New Password</GoldLabel>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="field mt-2 w-full px-4 py-3.5 text-sm"
            autoComplete="new-password"
          />
        </div>

        <div className="mt-4">
          <GoldLabel>Confirm New Password</GoldLabel>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            className="field mt-2 w-full px-4 py-3.5 text-sm"
            autoComplete="new-password"
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
          whileTap={saving ? undefined : { scale: 0.97 }}
          disabled={saving || !currentPassword || !newPassword || !confirm}
          onClick={handleSubmit}
          className="btn-crimson mt-5 w-full py-3.5 text-sm font-extrabold tracking-wide"
        >
          {saving ? "Updating…" : "UPDATE PASSWORD"}
        </motion.button>

        <p className="mt-3 text-center text-[10px] text-[#787d86]">
          Keep your PIN private. KeshVault will never ask for it.
        </p>
      </div>
    </div>
  );
}
