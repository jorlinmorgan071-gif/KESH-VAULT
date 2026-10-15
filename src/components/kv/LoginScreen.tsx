"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User, Phone, Users, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/**
 * KeshVault entry — two distinct doors:
 *  · LOGIN    (returning member): email/phone + password → "Welcome back"
 *  · REGISTER (new member): full name, phone, email, password, referral
 *  · FORGOT   password recovery verified by the phone number on file.
 * When the system does not recognise the email on login, the member is
 * offered a one-tap jump to registration with everything pre-filled.
 */

type Mode = "login" | "register" | "forgot";
const MODE_ORDER: Record<Mode, number> = { login: 0, forgot: 1, register: 2 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function normalizePhoneInput(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (/^0(7|1)\d{8}$/.test(digits)) return digits;
  if (/^254(7|1)\d{8}$/.test(digits)) return "0" + digits.slice(3);
  return null;
}

/* ---------- tiny building blocks ---------- */

function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white ${className}`}
      style={{ animation: "spin 0.7s linear infinite" }}
      aria-hidden
    />
  );
}

function AuthInput({
  icon: Icon,
  label,
  error,
  password,
  inputRef,
  ...props
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label?: string;
  error?: string;
  password?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [reveal, setReveal] = useState(false);
  const input = (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8e939c]" size={18} />
      <input
        {...props}
        ref={inputRef}
        type={password ? (reveal ? "text" : "password") : props.type}
        className={`auth-field h-[52px] w-full pl-11 ${password ? "pr-11" : "pr-4"} text-[15px] ${
          error ? "auth-field-error" : ""
        } ${props.className ?? ""}`}
      />
      {password && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={() => setReveal((r) => !r)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8e939c] transition-colors hover:text-white"
          aria-label={reveal ? "Hide password" : "Show password"}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={reveal ? "eye-off" : "eye"}
              initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
              transition={{ duration: 0.15 }}
              className="block"
            >
              {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );

  if (!label && !error) return input;
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-[13px] font-medium text-white">{label}</label>
      )}
      {input}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            className="overflow-hidden pl-1 pt-1 text-[11.5px] text-[#ff8a80]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="auth-divider-line" />
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#6b7078]">OR</span>
      <div className="auth-divider-line" />
    </div>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="auth-google flex h-[52px] w-full items-center justify-center gap-3 text-[15px] font-medium text-white"
    >
      <GoogleG />
      Continue with Google
    </motion.button>
  );
}

/* ---------- ambient particles ---------- */

const PARTICLES = [
  { x: 10, y: 20, size: 4, drift: 44, delay: 0, hue: "gold" },
  { x: 86, y: 16, size: 3, drift: 58, delay: 1.4, hue: "red" },
  { x: 22, y: 66, size: 5, drift: 36, delay: 0.7, hue: "gold" },
  { x: 78, y: 72, size: 4, drift: 50, delay: 2.1, hue: "red" },
  { x: 50, y: 10, size: 3, drift: 62, delay: 1.8, hue: "gold" },
  { x: 93, y: 46, size: 3, drift: 40, delay: 0.4, hue: "red" },
  { x: 5, y: 42, size: 3, drift: 54, delay: 2.6, hue: "gold" },
  { x: 64, y: 86, size: 4, drift: 33, delay: 1.1, hue: "gold" },
] as const;

/* ================================================================ */

export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [direction, setDirection] = useState(1);

  // login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // register
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referral, setReferral] = useState("");

  // forgot
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"identify" | "verify">("identify");

  // shared
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [succeeded, setSucceeded] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);
  const { toast } = useToast();

  const emailRef = useRef<HTMLInputElement>(null);

  // Invite deep-link: /?ref=CODE pre-fills referral and opens registration
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    const stored = sessionStorage.getItem("kv_ref");
    const code = (fromUrl ?? stored ?? "").toUpperCase();
    if (fromUrl) {
      setReferral(code.slice(0, 8));
      setMode("register");
      setDirection(1);
    } else if (code) {
      setReferral(code.slice(0, 8));
    }
  }, []);

  // Desktop convenience: focus the email field for one-tap login
  useEffect(() => {
    if (mode === "login" && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches) {
      emailRef.current?.focus();
    }
  }, [mode]);

  function goTo(next: Mode, opts?: { prefillIdentifier?: string; prefillEmail?: string; prefillPhone?: string }) {
    setDirection(MODE_ORDER[next] > MODE_ORDER[mode] ? 1 : -1);
    setError(null);
    setNotice(null);
    setFieldErrors({});
    if (next === "forgot") {
      setForgotStep("identify");
      setMaskedPhone("");
      if (opts?.prefillIdentifier) setForgotIdentifier(opts.prefillIdentifier);
    }
    if (opts?.prefillIdentifier) setIdentifier(opts.prefillIdentifier);
    if (opts?.prefillEmail) setEmail(opts.prefillEmail);
    if (opts?.prefillPhone) setPhone(opts.prefillPhone);
    setMode(next);
  }

  function flashSuccess() {
    setSucceeded(true);
    window.setTimeout(onAuthed, 480);
  }

  /* ---------------- LOGIN ---------------- */

  async function handleLogin() {
    setError(null);
    setNotice(null);
    const errs: Record<string, string> = {};
    if (!identifier.trim()) errs.identifier = "Enter your email or phone number.";
    if (!password) errs.password = "Enter your password.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    startTransition(async () => {
      try {
        await api.login({ identifier: identifier.trim(), password });
        toast({ title: "Welcome back", description: "The vault is open." });
        flashSuccess();
      } catch (e) {
        const err = e as Error & { code?: string };
        if (err.code === "NO_ACCOUNT") {
          setNotice(identifier.trim());
        } else {
          setError(err.message || "Something went wrong.");
        }
      }
    });
  }

  /* ---------------- REGISTER ---------------- */

  async function handleRegister() {
    setError(null);
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Enter your full name.";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Enter a valid email address.";
    if (!normalizePhoneInput(phone)) errs.phone = "Use format 07XX XXX XXX.";
    if (regPassword.length < 6) errs.regPassword = "At least 6 characters.";
    if (confirmPassword !== regPassword) errs.confirmPassword = "Passwords do not match.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    startTransition(async () => {
      try {
        await api.register({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizePhoneInput(phone)!,
          password: regPassword,
          confirmPassword,
          referral: referral.trim() || undefined,
        });
        toast({
          title: "Account created",
          description: "Your KES 100 sign-up bonus has been credited.",
        });
        flashSuccess();
      } catch (e) {
        const err = e as Error & { code?: string };
        if (err.code === "EMAIL_TAKEN") {
          setFieldErrors({ email: err.message });
        } else if (err.code === "PHONE_TAKEN") {
          setFieldErrors({ phone: err.message });
        } else {
          setError(err.message || "Something went wrong.");
        }
      }
    });
  }

  /* ---------------- FORGOT ---------------- */

  async function handleForgotStart() {
    setError(null);
    if (!forgotIdentifier.trim()) {
      setError("Enter the email or phone on your account.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.forgotStart(forgotIdentifier.trim());
      setMaskedPhone(res.maskedPhone);
      setForgotStep("verify");
    } catch (e) {
      setError((e as Error).message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotReset() {
    setError(null);
    const errs: Record<string, string> = {};
    if (!normalizePhoneInput(verifyPhone)) errs.verifyPhone = "Enter your registered phone number.";
    if (newPassword.length < 6) errs.newPassword = "At least 6 characters.";
    if (newPassword !== forgotConfirm) errs.forgotConfirm = "Passwords do not match.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    startTransition(async () => {
      try {
        await api.forgotReset({
          identifier: forgotIdentifier.trim(),
          phone: normalizePhoneInput(verifyPhone)!,
          newPassword,
          confirmPassword: forgotConfirm,
        });
        toast({ title: "Password updated", description: "You are signed back in." });
        flashSuccess();
      } catch (e) {
        setError((e as Error).message || "Something went wrong.");
      }
    });
  }

  const [forgotConfirm, setForgotConfirm] = useState("");
  const busyAny = busy || pending;

  function registerFromNotice() {
    const id = notice ?? "";
    goTo("register", {
      prefillEmail: EMAIL_RE.test(id) ? id.toLowerCase() : undefined,
      prefillPhone: EMAIL_RE.test(id) ? undefined : (normalizePhoneInput(id) ?? undefined),
    });
  }

  const HEADING: Record<Mode, { title: string; sub: string }> = {
    login: { title: "Welcome back", sub: "Log in to your account" },
    register: { title: "Create account", sub: "Join the vault and start earning" },
    forgot: { title: "Reset password", sub: "We'll get you back in fast" },
  };

  const cardVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 76 : -76, opacity: 0, scale: 0.97, filter: "blur(5px)" }),
    center: { x: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: (dir: number) => ({ x: dir > 0 ? -76 : 76, opacity: 0, scale: 0.97, filter: "blur(5px)" }),
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#050506]">
      {/* ambient atmosphere */}
      <div className="light-rays" aria-hidden />
      <div className="vault-glow" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, rgba(220,38,38,0.16) 0%, rgba(220,38,38,0.05) 45%, transparent 75%)",
        }}
        aria-hidden
      />
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${
              p.hue === "gold" ? "rgba(240,208,96,0.85)" : "rgba(239,68,68,0.8)"
            } 0%, transparent 70%)`,
            filter: "blur(1px)",
          }}
          animate={{ y: [0, -26 - p.drift / 10, 0], opacity: [0.12, 0.55, 0.12] }}
          transition={{ duration: 8 + p.drift / 14, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          aria-hidden
        />
      ))}

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-sm flex-col overflow-y-auto px-6 py-8 no-scrollbar">
        <div className="my-auto w-full pb-2">
          {/* ---- brand header ---- */}
          <div className="mb-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.55, opacity: 0, rotate: -10, y: 14 }}
              animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 170, damping: 13, delay: 0.15 }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                className="auth-logo-tile flex h-20 w-20 items-center justify-center"
              >
                <ArrowRight className="relative z-10 text-white" size={36} strokeWidth={2.6} />
              </motion.div>
            </motion.div>
            <span className="gold-text mt-4 text-[11px] font-bold tracking-[0.34em]">KESHVAULT</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <h1 className="mt-2 text-[28px] font-bold leading-tight text-white">{HEADING[mode].title}</h1>
                <p className="mt-1 text-[15px] text-[#9ca3af]">{HEADING[mode].sub}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ---- the card ---- */}
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={mode}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {mode === "login" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                >
                  <div className="auth-card px-5 py-5">
                    <GoogleButton onClick={() => setGoogleOpen(true)} />
                    <Divider />
                    <div className="space-y-3.5">
                      <AuthInput
                        icon={Mail}
                        inputRef={emailRef}
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (notice) setNotice(null);
                        }}
                        placeholder="Email or phone number"
                        autoComplete="username"
                        error={fieldErrors.identifier}
                      />
                      <AuthInput
                        icon={Lock}
                        password
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        error={fieldErrors.password}
                      />
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => goTo("forgot", { prefillIdentifier: identifier })}
                        className="auth-link px-1 py-0.5 text-[13px]"
                      >
                        Forgot password?
                      </motion.button>
                    </div>

                    {/* system does not recognise this member → offer registration */}
                    <AnimatePresence>
                      {notice && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", stiffness: 260, damping: 28 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 rounded-xl border border-[rgba(239,68,68,0.38)] bg-[rgba(239,68,68,0.07)] p-4">
                            <p className="text-[12.5px] leading-snug text-[#ffb4b4]">
                              We couldn&apos;t find an account for{" "}
                              <span className="font-semibold text-white">{notice}</span>.
                            </p>
                            <p className="mt-1 text-[11.5px] leading-snug text-[#9ca3af]">
                              New here? The system doesn&apos;t recognise this email — create your account now,
                              it takes under a minute.
                            </p>
                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.97 }}
                              onClick={registerFromNotice}
                              className="auth-btn mt-3 h-10 w-full text-[13.5px] font-semibold"
                            >
                              Create my account
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => setNotice(null)}
                              className="mt-2 w-full py-1 text-[12px] text-[#8a8f98] transition-colors hover:text-white"
                            >
                              I&apos;ll re-check my details
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <ErrorBanner error={error} />

                    <motion.button
                      type="submit"
                      whileTap={busyAny ? undefined : { scale: 0.98 }}
                      whileHover={busyAny ? undefined : { y: -1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      disabled={busyAny}
                      className="auth-btn mt-4 h-[52px] w-full text-[16px] font-semibold tracking-[0.01em]"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {succeeded ? (
                          <motion.span
                            key="ok"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <motion.svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <motion.path
                                d="M4 12.5l5 5L20 7"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                              />
                            </motion.svg>
                            Opening the vault…
                          </motion.span>
                        ) : pending ? (
                          <motion.span
                            key="spin"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <Spinner /> Signing in…
                          </motion.span>
                        ) : (
                          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            Log in
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <p className="mt-5 text-center text-[13.5px] text-[#9ca3af]">
                      Don&apos;t have an account?{" "}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => goTo("register")}
                        className="auth-link font-semibold"
                      >
                        Create one
                      </motion.button>
                    </p>
                  </div>
                </form>
              )}

              {mode === "register" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegister();
                  }}
                >
                  <div className="auth-card px-5 py-5">
                    <GoogleButton onClick={() => setGoogleOpen(true)} />
                    <Divider />
                    <div className="space-y-4">
                      {[
                        <AuthInput
                          key="name"
                          icon={User}
                          label="Full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          autoComplete="name"
                          error={fieldErrors.fullName}
                        />,
                        <AuthInput
                          key="phone"
                          icon={Phone}
                          label="Phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="07XX XXX XXX"
                          autoComplete="tel"
                          inputMode="tel"
                          error={fieldErrors.phone}
                        />,
                        <AuthInput
                          key="email"
                          icon={Mail}
                          label="Email (used to log in)"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                          inputMode="email"
                          error={fieldErrors.email}
                        />,
                        <div key="pw">
                          <AuthInput
                            icon={Lock}
                            label="Password"
                            password
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Create a password"
                            autoComplete="new-password"
                            error={fieldErrors.regPassword}
                          />
                          <PasswordStrength password={regPassword} />
                        </div>,
                        <AuthInput
                          key="confirm"
                          icon={Lock}
                          label="Confirm password"
                          password
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          error={fieldErrors.confirmPassword}
                        />,
                        <AuthInput
                          key="ref"
                          icon={Users}
                          label="Referral / invite code (optional)"
                          value={referral}
                          onChange={(e) => setReferral(e.target.value.toUpperCase())}
                          placeholder="e.g. 27FPQY"
                          maxLength={8}
                          className="uppercase tracking-[0.14em]"
                        />,
                      ].map((field, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.06 + i * 0.05 }}
                        >
                          {field}
                        </motion.div>
                      ))}
                    </div>

                    <ErrorBanner error={error} />

                    <motion.button
                      type="submit"
                      whileTap={busyAny ? undefined : { scale: 0.98 }}
                      whileHover={busyAny ? undefined : { y: -1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      disabled={busyAny}
                      className="auth-btn mt-5 h-[52px] w-full text-[16px] font-semibold tracking-[0.01em]"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {succeeded ? (
                          <motion.span
                            key="ok"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <motion.svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <motion.path
                                d="M4 12.5l5 5L20 7"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                              />
                            </motion.svg>
                            Vault opening…
                          </motion.span>
                        ) : pending ? (
                          <motion.span
                            key="spin"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <Spinner /> Creating account…
                          </motion.span>
                        ) : (
                          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            Create account
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <p className="mt-5 text-center text-[13.5px] text-[#9ca3af]">
                      Already a member?{" "}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          goTo("login", {
                            prefillIdentifier: EMAIL_RE.test(email) ? email.trim().toLowerCase() : undefined,
                          })
                        }
                        className="auth-link font-semibold"
                      >
                        Log in
                      </motion.button>
                    </p>
                  </div>
                </form>
              )}

              {mode === "forgot" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (forgotStep === "identify") handleForgotStart();
                    else handleForgotReset();
                  }}
                >
                  <div className="auth-card px-5 py-5">
                    {forgotStep === "identify" ? (
                      <>
                        <p className="text-[13px] leading-relaxed text-[#9ca3af]">
                          Enter the email or phone number on your account — we&apos;ll verify it&apos;s really
                          you before setting a new password.
                        </p>
                        <div className="mt-4">
                          <AuthInput
                            icon={Mail}
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            placeholder="Email or phone on your account"
                            autoComplete="username"
                          />
                        </div>
                        <ErrorBanner error={error} />
                        <motion.button
                          type="submit"
                          whileTap={busyAny ? undefined : { scale: 0.98 }}
                          disabled={busyAny}
                          className="auth-btn mt-4 h-[52px] w-full text-[16px] font-semibold"
                        >
                          {busy ? (
                            <span className="flex items-center justify-center gap-2">
                              <Spinner /> Looking up…
                            </span>
                          ) : (
                            "Find my account"
                          )}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.07)] p-3.5"
                        >
                          <p className="text-[12.5px] leading-snug text-[#e9cf6e]">
                            Account found. Confirm the phone number registered to it —
                            it should look like <span className="font-semibold">{maskedPhone}</span>.
                          </p>
                        </motion.div>
                        <div className="mt-4 space-y-4">
                          <AuthInput
                            icon={Phone}
                            label="Registered phone number"
                            value={verifyPhone}
                            onChange={(e) => setVerifyPhone(e.target.value)}
                            placeholder="07XX XXX XXX"
                            autoComplete="tel"
                            inputMode="tel"
                            error={fieldErrors.verifyPhone}
                          />
                          <AuthInput
                            icon={Lock}
                            label="New password"
                            password
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            autoComplete="new-password"
                            error={fieldErrors.newPassword}
                          />
                          <AuthInput
                            icon={Lock}
                            label="Confirm new password"
                            password
                            value={forgotConfirm}
                            onChange={(e) => setForgotConfirm(e.target.value)}
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                            error={fieldErrors.forgotConfirm}
                          />
                        </div>
                        <ErrorBanner error={error} />
                        <motion.button
                          type="submit"
                          whileTap={busyAny ? undefined : { scale: 0.98 }}
                          disabled={busyAny}
                          className="auth-btn mt-4 h-[52px] w-full text-[16px] font-semibold"
                        >
                          {pending ? (
                            <span className="flex items-center justify-center gap-2">
                              <Spinner /> Updating…
                            </span>
                          ) : succeeded ? (
                            "Signed in"
                          ) : (
                            "Set new password"
                          )}
                        </motion.button>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotStep("identify");
                            setMaskedPhone("");
                            setVerifyPhone("");
                            setNewPassword("");
                            setForgotConfirm("");
                            setError(null);
                            setFieldErrors({});
                          }}
                          className="mt-3 w-full py-1 text-[12.5px] text-[#8a8f98] transition-colors hover:text-white"
                        >
                          Use a different account
                        </button>
                      </>
                    )}

                    <p className="mt-5 text-center text-[13.5px] text-[#9ca3af]">
                      Remembered it?{" "}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => goTo("login", { prefillIdentifier: forgotIdentifier })}
                        className="auth-link font-semibold"
                      >
                        Back to log in
                      </motion.button>
                    </p>
                  </div>
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-7 text-center text-[10px] leading-relaxed tracking-[0.14em] text-[#4d525a] uppercase"
          >
            Secure M-Pesa deposits & withdrawals · KES 100 sign-up bonus
          </motion.p>
        </div>
      </div>

      {/* ---- Google sign-in notice ---- */}
      <AnimatePresence>
        {googleOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGoogleOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-8 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="auth-card w-full max-w-xs px-5 py-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#35363d] bg-[#212228]">
                <GoogleG size={24} />
              </div>
              <h3 className="mt-4 text-[16px] font-bold text-white">Google sign-in</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#9ca3af]">
                This deployment signs members in with email &amp; password. Google sign-in needs an
                external Google OAuth connection — until it&apos;s linked, continue with your email below.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setGoogleOpen(false);
                  goTo("login");
                }}
                className="auth-btn mt-5 h-11 w-full text-[14px] font-semibold"
              >
                Continue with email
              </motion.button>
              <button
                onClick={() => setGoogleOpen(false)}
                className="mt-2.5 w-full py-1 text-[12.5px] text-[#8a8f98] transition-colors hover:text-white"
              >
                Not now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- helpers ---------- */

function ErrorBanner({ error }: { error: string | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6, x: 0 }}
          animate={{ opacity: 1, y: 0, x: [0, -5, 5, -3, 3, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-3 rounded-lg border border-[rgba(229,57,53,0.3)] bg-[rgba(229,57,53,0.08)] px-3 py-2 text-center text-xs text-[#ff8a80]"
          role="alert"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PasswordStrength({ password }: { password: string }) {
  function score(pw: string): number {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++;
    if (pw.length >= 10 || /[^a-zA-Z0-9]/.test(pw)) s++;
    return Math.min(3, s);
  }
  const s = score(password);
  if (!password) return null;
  const colors = ["#ef4444", "#f59e0b", "#22c55e"];
  const labels = ["Weak", "Fair", "Strong"];
  return (
    <div className="mt-2 flex items-center gap-2 px-1">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2].map((seg) => (
          <motion.div
            key={seg}
            animate={{
              backgroundColor: seg < s ? colors[s - 1] : "rgba(255,255,255,0.08)",
            }}
            transition={{ duration: 0.25 }}
            className="h-[3px] flex-1 rounded-full"
          />
        ))}
      </div>
      <motion.span
        key={s}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[10px] font-medium"
        style={{ color: colors[s - 1] }}
      >
        {labels[s - 1]}
      </motion.span>
    </div>
  );
}
