"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { GoldDiamond } from "@/components/kv/shared/ui";
import { useToast } from "@/hooks/use-toast";

/**
 * Enter the Vault — single intelligent entry point.
 * The form silently detects returning members (password only → Sign in)
 * vs new identities (confirm password + optional referral → Create account).
 */
export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [mode, setMode] = useState<"idle" | "signin" | "signup">("idle");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [checking, setChecking] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const busy = checking || pending;

  // Invite deep-link: /?ref=CODE pre-fills the referral field
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    const stored = sessionStorage.getItem("kv_ref");
    const code = (fromUrl ?? stored ?? "").toUpperCase();
    if (code) setReferral(code.slice(0, 8));
  }, []);

  async function handleContinue() {
    setError(null);
    if (!identifier.trim()) {
      setError("Enter your email or phone number to continue.");
      return;
    }
    setChecking(true);
    try {
      const { exists } = await api.checkIdentity(identifier);
      setMode(exists ? "signin" : "signup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setChecking(false);
    }
  }

  function reset() {
    setMode("idle");
    setPassword("");
    setConfirmPassword("");
    setReferral("");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!password) {
      setError("Enter your password.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      try {
        if (mode === "signin") {
          await api.login({ identifier, password });
          toast({ title: "Welcome back", description: "The vault is open." });
        } else {
          await api.register({
            identifier,
            password,
            confirmPassword,
            referral: referral.trim() || undefined,
          });
          toast({
            title: "Account created",
            description: "Your KES 100 sign-up bonus has been credited.",
          });
        }
        onAuthed();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0a0a0b] px-5 py-10">
      {/* atmosphere */}
      <div className="light-rays" aria-hidden />
      <div className="vault-glow" aria-hidden />
      {/* floating gold particles */}
      { PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "radial-gradient(circle, rgba(240,208,96,0.9) 0%, rgba(212,175,55,0) 70%)",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -30 - p.drift, 0],
            opacity: [0.15, 0.7, 0.15],
          }}
          transition={{
            duration: 7 + p.drift / 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          aria-hidden
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* brand mark */}
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.25 }}
            className="glow-gold mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-[rgba(212,175,55,0.4)] bg-[linear-gradient(160deg,rgba(212,175,55,0.16),rgba(212,175,55,0.03))]"
          >
            <GoldDiamond size={38} />
          </motion.div>
          <div className="flex items-center gap-2">
            <GoldDiamond size={18} />
            <span className="gold-text text-xl font-extrabold tracking-[0.28em]">KESHVAULT</span>
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-[#8a8f98]">
            Private rewards. Daily growth.
            <br />
            Seamless liquidity.
          </p>
        </div>

        {/* the card */}
        <motion.div
          layout
          className="kv-card-gold relative overflow-hidden px-6 py-7"
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        >
          <h1 className="text-center text-xl font-bold text-white">
            {mode === "signup" ? "Create your key" : "Enter the Vault"}
          </h1>
          <p className="mt-1.5 text-center text-[11px] text-[#8a8f98]">
            {mode === "signin"
              ? "The vault recognises you. Sign in below."
              : mode === "signup"
                ? "New identity detected — set your credentials."
                : "Sign in with your email or phone number."}
          </p>

          <div className="mt-6 space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
                Email or Phone
              </label>
              <div className="relative">
                <input
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (mode !== "idle") reset();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mode === "idle") handleContinue();
                    if (e.key === "Enter" && mode !== "idle") handleSubmit();
                  }}
                  placeholder="name@mail.com or 07XX XXX XXX"
                  className="field w-full px-4 py-3.5 text-sm"
                  autoComplete="username"
                  disabled={busy && mode !== "idle"}
                />
                {mode !== "idle" && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={reset}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-[#8a8f98] hover:text-[#d4af37]"
                  >
                    Change
                  </motion.button>
                )}
              </div>
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {mode !== "idle" && (
                <motion.div
                  key="password-fields"
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="space-y-3.5 overflow-hidden"
                >
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="••••••••"
                      className="field w-full px-4 py-3.5 text-sm"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    />
                  </div>

                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 }}
                    >
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="••••••••"
                        className="field w-full px-4 py-3.5 text-sm"
                        autoComplete="new-password"
                      />
                    </motion.div>
                  )}

                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14 }}
                    >
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a8f98]">
                        Invite Code <span className="normal-case tracking-normal">(optional)</span>
                      </label>
                      <input
                        value={referral}
                        onChange={(e) => setReferral(e.target.value.toUpperCase())}
                        placeholder="e.g. 2F39XB"
                        className="field w-full px-4 py-3.5 text-sm tracking-[0.2em] uppercase"
                        maxLength={8}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-lg border border-[rgba(229,57,53,0.3)] bg-[rgba(229,57,53,0.08)] px-3 py-2 text-center text-xs text-[#ff8a80]"
                role="alert"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-6">
            {mode === "idle" ? (
              <motion.button
                whileTap={busy ? undefined : { scale: 0.965 }}
                whileHover={busy ? undefined : { y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handleContinue}
                disabled={busy}
                className="btn-crimson w-full py-3.5 text-sm font-bold tracking-wide"
              >
                {checking ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ◆
                  </motion.span>
                ) : (
                  "Continue"
                )}
              </motion.button>
            ) : (
              <motion.button
                layout
                whileTap={busy ? undefined : { scale: 0.965 }}
                whileHover={busy ? undefined : { y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={handleSubmit}
                disabled={busy}
                className="btn-crimson w-full py-3.5 text-sm font-bold tracking-wide"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </motion.button>
            )}
          </div>

          <p className="mt-5 text-center text-[10px] leading-relaxed text-[#6b7078]">
            Your credentials never leave this secure environment.
            <br />
            Sign-up bonus KES 100 · Min investment KES 1,200 · Min withdrawal KES 250
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-[10px] tracking-[0.18em] text-[#4d525a] uppercase"
        >
          KeshVault · Secure M-Pesa deposits & withdrawals
        </motion.p>
      </motion.div>
    </div>
  );
}

const PARTICLES = [
  { x: 12, y: 22, size: 5, drift: 40, delay: 0 },
  { x: 84, y: 18, size: 4, drift: 55, delay: 1.2 },
  { x: 22, y: 68, size: 6, drift: 34, delay: 0.6 },
  { x: 76, y: 74, size: 5, drift: 48, delay: 2 },
  { x: 50, y: 12, size: 3, drift: 62, delay: 1.6 },
  { x: 92, y: 48, size: 4, drift: 38, delay: 0.3 },
  { x: 6, y: 44, size: 3, drift: 52, delay: 2.4 },
];
