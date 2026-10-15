"use client";

import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

/** Spring count-up for money values — fluid balance animations. */
export function MoneyTicker({
  value,
  prefix = "KES ",
  className,
  decimals = 2,
}: {
  value: number;
  prefix?: string;
  className?: string;
  decimals?: number;
}) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 90, damping: 22, mass: 0.9 });
  const text = useTransform(spring, (v) =>
    `${prefix}${v.toLocaleString("en-KE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`
  );
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      mv.set(value);
      spring.set(value);
      first.current = false;
      return;
    }
    mv.set(value);
  }, [value, mv, spring]);

  return <motion.span className={className}>{text}</motion.span>;
}

/** Gold diamond brand mark with glow and subtle float. */
export function GoldDiamond({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d873" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#9c7a26" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5 L21 9 L12 22.5 L3 9 Z"
        stroke="url(#gd)"
        strokeWidth="1.4"
        fill="rgba(212,175,55,0.14)"
      />
      <path d="M3 9 H21" stroke="url(#gd)" strokeWidth="1" opacity="0.8" />
      <path d="M12 1.5 L7.5 9 L12 22.5 L16.5 9 Z" stroke="url(#gd)" strokeWidth="0.9" opacity="0.65" fill="none" />
    </motion.svg>
  );
}

/** Section label in gold uppercase with tracking, per the luxury system. */
export function GoldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4af37] ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/** Primary crimson action button with spring press physics. */
export function CrimsonButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.965 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`btn-crimson w-full py-3.5 text-sm font-bold tracking-wide ${className ?? ""}`}
    >
      {children}
    </motion.button>
  );
}

/** Outlined gold secondary button. */
export function GoldOutlineButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.965 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`btn-gold-outline w-full py-3.5 text-sm font-bold tracking-wide ${className ?? ""}`}
    >
      {children}
    </motion.button>
  );
}

/** Staggered entrance container for lists/cards. */
export const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const riseIn = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 24 },
  },
};

/** Animated stat tile used on Mine / Team. */
export function StatTile({
  label,
  value,
  money,
  accent,
}: {
  label: string;
  value: number;
  money?: boolean;
  accent?: "gold" | "white" | "green";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const color =
    accent === "gold" ? "gold-text" : accent === "green" ? "text-[#00c853]" : "text-white";

  return (
    <div ref={ref} className="kv-card flex-1 px-3 py-3.5 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={`text-base font-extrabold ${color}`}
      >
        {money ? <MoneyTicker value={value} /> : Math.round(value).toLocaleString()}
      </motion.div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a8f98]">
        {label}
      </div>
    </div>
  );
}

/** Sub-page header with back chevron, per the design system. */
export function SubPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-[rgba(212,175,55,0.08)] bg-[#0a0a0b]/85 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onBack}
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1b20] text-[#c9cdd4]"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>
        <h1 className="text-base font-bold text-white">{title}</h1>
      </div>
    </div>
  );
}

/** Status pill (COMPLETED / PROCESSING / PENDING). */
export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-[rgba(0,200,83,0.12)] text-[#00c853] border-[rgba(0,200,83,0.3)]",
    PROCESSING: "bg-[rgba(212,175,55,0.12)] text-[#e9cf6e] border-[rgba(212,175,55,0.35)]",
    PENDING: "bg-[rgba(212,175,55,0.12)] text-[#e9cf6e] border-[rgba(212,175,55,0.35)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
        styles[status] ?? styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}

/** Small toast-ready icon row for records. */
export function TypeIcon({ type }: { type: string }) {
  const map: Record<string, { emoji: string; bg: string }> = {
    BONUS: { emoji: "🎁", bg: "rgba(212,175,55,0.15)" },
    RECHARGE: { emoji: "⚡", bg: "rgba(0,200,83,0.12)" },
    WITHDRAW: { emoji: "🏦", bg: "rgba(196,30,58,0.16)" },
    PACKAGE: { emoji: "🚗", bg: "rgba(196,30,58,0.14)" },
    DAILY: { emoji: "📈", bg: "rgba(0,200,83,0.12)" },
    REFERRAL: { emoji: "👥", bg: "rgba(212,175,55,0.14)" },
    CHECKIN: { emoji: "📅", bg: "rgba(212,175,55,0.12)" },
    GIFT: { emoji: "🎟️", bg: "rgba(212,175,55,0.15)" },
  };
  const conf = map[type] ?? map.BONUS;
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
      style={{ background: conf.bg }}
    >
      {conf.emoji}
    </div>
  );
}
