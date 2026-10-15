export type SessionUser = {
  id: string;
  shortId: string;
  email: string | null;
  phone: string;
  displayName: string;
  mpesaPhone: string;
  inviteCode: string;
  balance: number;
  welcomeSeen: boolean;
  guideSeen: boolean;
  lastCheckIn: string | null;
  createdAt: string;
};

export type SessionStats = {
  todayEarnings: number;
  inviteIncome: number;
  activeTeam: number;
  activeOrders: number;
};

export type SessionPayload = {
  user: SessionUser | null;
  stats?: SessionStats;
};

export type PackageDTO = {
  id: string;
  name: string;
  image: string;
  durationDays: number;
  dailyReturn: number;
  stake: number;
  totalReturn: number;
  limitPerUser: number;
  sortOrder: number;
  active: boolean;
  ownedCount: number;
};

export type OrderDTO = {
  id: string;
  packageName: string;
  packageImage: string;
  stakePaid: number;
  dailyReturn: number;
  durationDays: number;
  totalReturn: number;
  status: "ACTIVE" | "EXPIRED";
  activatedAt: string;
  expiresAt: string;
  totalPaidOut: number;
  daysElapsed: number;
  remainingDays: number;
  dailyToCome: number;
  progress: number;
};

export type TransactionDTO = {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  description: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  displayName: string;
  joinedAt: string;
  active: boolean;
  activePackages: string[];
  level: number;
};

export type TeamPayload = {
  inviteCode: string;
  stats: {
    teamSize: number;
    totalActive: number;
    inviteIncome: number;
    activeTeam: number;
  };
  levels: { level1: TeamMember[]; level2: TeamMember[]; level3: TeamMember[] };
  commission: { l1: number; l2: number; l3: number };
};

export type CouponDTO = {
  id: string;
  code: string;
  amount: number;
  status: string;
  createdAt: string;
};

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`
    ) as Error & { code?: string };
    err.code = (data as { code?: string }).code;
    throw err;
  }
  return data as T;
}

export const api = {
  checkIdentity: (identifier: string) =>
    fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    }).then(handle<{ exists: boolean; kind: string }>),

  register: (payload: {
    identifier?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    password: string;
    confirmPassword: string;
    referral?: string;
  }) =>
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle<{ ok: boolean }>),

  forgotStart: (identifier: string) =>
    fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", identifier }),
    }).then(handle<{ ok: boolean; maskedPhone: string }>),

  forgotReset: (payload: {
    identifier: string;
    phone: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", ...payload }),
    }).then(handle<{ ok: boolean }>),

  login: (payload: { identifier: string; password: string }) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle<{ ok: boolean }>),

  logout: () => fetch("/api/auth/logout", { method: "POST" }).then(handle<{ ok: boolean }>),

  session: () => fetch("/api/session", { cache: "no-store" }).then(handle<SessionPayload>),

  preferences: (payload: { welcomeSeen?: boolean; guideSeen?: boolean }) =>
    fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle<{ ok: boolean }>),

  packages: () => fetch("/api/packages", { cache: "no-store" }).then(handle<{ packages: PackageDTO[] }>),

  orders: () => fetch("/api/orders", { cache: "no-store" }).then(handle<{ orders: OrderDTO[]; history: TransactionDTO[] }>),

  purchase: (packageId: string) =>
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    }).then(handle<{ ok: boolean }>),

  withdrawInfo: () =>
    fetch("/api/withdraw", { cache: "no-store" }).then(
      handle<{
        balance: number;
        mpesaPhone: string;
        rules: { feeRate: number; min: number; max: number };
        windowOpen: boolean;
      }>
    ),

  withdraw: (payload: { amount: number; phone?: string }) =>
    fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle<{ ok: boolean; fee: number; net: number }>),

  recharge: (payload: { amount: number; phone: string }) =>
    fetch("/api/recharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle<{ ok: boolean; credited: number }>),

  records: (tab: string) =>
    fetch(`/api/records?tab=${tab}`, { cache: "no-store" }).then(handle<{ records: TransactionDTO[] }>),

  team: () => fetch("/api/team", { cache: "no-store" }).then(handle<TeamPayload>),

  checkin: () => fetch("/api/checkin", { method: "POST" }).then(handle<{ ok: boolean; amount: number }>),

  redeemGift: (code: string) =>
    fetch("/api/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then(handle<{ ok: boolean; amount: number }>),

  coupons: () => fetch("/api/coupons", { cache: "no-store" }).then(handle<{ coupons: CouponDTO[] }>),

  resetPassword: (payload: { currentPassword: string; newPassword: string }) =>
    fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle<{ ok: boolean }>),

  withdrawAccount: () =>
    fetch("/api/withdraw-account", { cache: "no-store" }).then(handle<{ mpesaPhone: string }>),

  updateWithdrawAccount: (phone: string) =>
    fetch("/api/withdraw-account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }).then(handle<{ ok: boolean; mpesaPhone: string }>),
};

export function formatKES(amount: number, decimals = 2): string {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
