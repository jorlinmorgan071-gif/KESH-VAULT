"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { api, SessionPayload } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { LoginScreen } from "@/components/kv/LoginScreen";
import { BottomNav } from "@/components/kv/shared/BottomNav";
import { HomeScreen } from "@/components/kv/screens/HomeScreen";
import { ProductsScreen } from "@/components/kv/screens/ProductsScreen";
import { IncomeScreen } from "@/components/kv/screens/IncomeScreen";
import { TeamScreen } from "@/components/kv/screens/TeamScreen";
import { MineScreen } from "@/components/kv/screens/MineScreen";
import { WithdrawScreen } from "@/components/kv/screens/WithdrawScreen";
import { RechargeScreen } from "@/components/kv/screens/RechargeScreen";
import { RecordsScreen } from "@/components/kv/screens/RecordsScreen";
import { CouponScreen } from "@/components/kv/screens/CouponScreen";
import { InfluencerScreen } from "@/components/kv/screens/InfluencerScreen";
import { BonusScreen } from "@/components/kv/screens/BonusScreen";
import { WithdrawAccountScreen } from "@/components/kv/screens/WithdrawAccountScreen";
import { ResetPasswordScreen } from "@/components/kv/screens/ResetPasswordScreen";
import { WelcomeModal, HowItWorksModal, AboutModal } from "@/components/kv/modals/InfoModals";

// ---------- session context ----------
const SessionContext = createContext<{ data: SessionPayload | null; isLoading: boolean }>({
  data: null,
  isLoading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

// ---------- query client ----------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, refetchOnWindowFocus: true, retry: 1 },
  },
});

export function KeshVaultApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

function AppInner() {
  const { data: session, isLoading, error, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: api.session,
    refetchInterval: 60_000, // keeps daily earnings & withdrawal settlement fresh
  });

  if (isLoading) {
    return <BootScreen />;
  }

  if (error || !session?.user) {
    return <LoginScreen onAuthed={() => refetch()} />;
  }

  return (
    <SessionContext.Provider value={{ data: session, isLoading }}>
      <AuthenticatedApp />
    </SessionContext.Provider>
  );
}

function BootScreen() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0a0a0b]">
      <div className="light-rays" aria-hidden />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
        className="glow-gold flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.4)]"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="bootgd" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5d873" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#9c7a26" />
            </linearGradient>
          </defs>
          <path d="M12 1.5 L21 9 L12 22.5 L3 9 Z" stroke="url(#bootgd)" strokeWidth="1.4" fill="rgba(212,175,55,0.14)" />
          <path d="M3 9 H21" stroke="url(#bootgd)" strokeWidth="1" opacity="0.8" />
          <path d="M12 1.5 L7.5 9 L12 22.5 L16.5 9 Z" stroke="url(#bootgd)" strokeWidth="0.9" opacity="0.65" fill="none" />
        </svg>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]"
      >
        Opening the vault
      </motion.p>
    </div>
  );
}

function AuthenticatedApp() {
  const { data: session } = useSession();
  const { tab, subView, direction, openModal } = useAppStore();
  const onboardingShown = useRef(false);

  // First-login onboarding: welcome rules → how it works
  useEffect(() => {
    if (!session?.user || onboardingShown.current) return;
    onboardingShown.current = true;
    const t = setTimeout(() => {
      if (!session.user!.welcomeSeen) {
        openModal("welcome");
      } else if (!session.user!.guideSeen) {
        openModal("howitworks");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [session?.user?.id, session?.user?.welcomeSeen, session?.user?.guideSeen, openModal]);

  // welcome dismissed → show guide next
  const modal = useAppStore((s) => s.modal);

  // Pick the current view
  const view = subView ?? tab;

  const screens: Record<string, React.ReactNode> = {
    home: <HomeScreen />,
    products: <ProductsScreen />,
    income: <IncomeScreen />,
    team: <TeamScreen />,
    mine: <MineScreen />,
    withdraw: <WithdrawScreen />,
    recharge: <RechargeScreen />,
    records: <RecordsScreen />,
    coupon: <CouponScreen />,
    influencer: <InfluencerScreen />,
    bonus: <BonusScreen />,
    "withdraw-account": <WithdrawAccountScreen />,
    "reset-password": <ResetPasswordScreen />,
  };

  return (
    <div className="relative min-h-dvh bg-[#0a0a0b]">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(212,175,55,0.07),transparent)]" />
        <div className="absolute bottom-24 inset-x-0 h-48 bg-[radial-gradient(50%_100%_at_50%_100%,rgba(196,30,58,0.05),transparent)]" />
      </div>

      {/* app column — mobile-first, centered on desktop */}
      <div className="relative mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-3">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={view}
            custom={direction}
            initial={{
              opacity: 0,
              x: subView ? direction * 40 : 0,
              y: subView ? 0 : 14,
              scale: subView ? 1 : 0.995,
            }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: subView ? direction * -32 : 0,
              y: subView ? 0 : -10,
              scale: subView ? 1 : 0.995,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.85 }}
          >
            {screens[view] ?? screens.home}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />

      {/* modals */}
      <WelcomeModal />
      <HowItWorksModal />
      <AboutModal />

      {/* store session dependency for children that use queryClient */}
      <SessionRefresher />
    </div>
  );
}

/** Refreshes session data when the welcome modal closes so guide flow works smoothly. */
function SessionRefresher() {
  const modal = useAppStore((s) => s.modal);
  const prev = useRef<string | null>(null);
  const client = useQueryClient();

  useEffect(() => {
    if (prev.current === "welcome" && modal === null) {
      client.invalidateQueries({ queryKey: ["session"] });
    }
    prev.current = modal;
  }, [modal, client]);

  return null;
}
