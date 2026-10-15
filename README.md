# KESHVAULT 💎

**A dark-luxury member rewards platform** — activate earning packages, grow a 3-level referral team, and move value through M-Pesa & Airtel Money with deep, fluid motion design.

---

## ✨ What's inside

| Area | Details |
|------|---------|
| **Auth** | Single adaptive entry point ("Enter the Vault") — the form silently detects returning members (password → *Sign in*) vs new identities (confirm password + optional invite code → *Create account*). Sessions via signed httpOnly JWT cookies. |
| **Home** | Gold diamond brandmark, red-gradient hero banner with animated shine, 8-tile gold quick-action grid, security strip, Events section (Top Earner Rewards · Community Meetup). |
| **Products** | 7 luxury Mercedes-themed packages (A-Class → Maybach) with real car photography, daily return, stake, total return, purchase limits and a spring-physics purchase confirmation sheet. |
| **Income** | Live order tracking — VALID / EXPIRED tabs, animated progress bars, paid-out vs to-come totals, full earning history. Daily returns are credited automatically every 24h by the settlement engine. |
| **Team** | Invite code hero card with one-tap copy, 12% · 5% · 3% commission structure, Level 1/2/3 member lists with live activity status. |
| **Mine** | Gold avatar + LVL badge, animated balance ticker, RECHARGE / WITHDRAW dual buttons, Today · Active Team · Invite Income KPIs, account menu, community links. |
| **Wallet flows** | Airtel Money recharge (24/7) with simulated gateway handshake; M-Pesa withdrawals with live 16% fee calculator, KES 250–25,000 limits and the **9 AM – 7 PM EAT** time-gate (closed-state button + countdown outside hours). |
| **Records** | ACCOUNT / RECHARGE / WITHDRAW segmented filters, signed amounts, status pills, unique references (`BON-…`, `RCH-…`, `WDR-…`). |
| **Bonus** | Daily check-in (KES 5–15 / 24h) + gift code redemption with a live countdown to the next 5:00 PM release. |
| **Modals** | Welcome rule-set (first login), 3-step "How KeshVault works" guide (first visit + replay), About, My Coupon vouchers. |

## 🎬 Motion system

Built with **Framer Motion** — every interaction is spring-driven:

- Directional page transitions (slide for push/pop sub-pages, lift-fade for tab switches)
- Staggered card/list entrances, layout-animated tab pills & nav indicator
- Spring count-up money tickers on balances and stats
- Bottom-sheet purchase drawer (vaul) with drag physics
- Modal spring pop-ins with blurred overlays
- Hero shine sweep, rotating light rays and floating gold particles on the login screen

## 🛠 Tech stack

- **Next.js 16** (App Router) + **TypeScript 5**
- **Tailwind CSS 4** + custom gold/crimson design tokens
- **Prisma ORM** (SQLite) — users, packages, orders, transactions, coupons, gift codes
- **TanStack Query** + **Zustand** for server/client state
- **Framer Motion** + **vaul** for animation
- **bcryptjs** + **jose** for auth

## 🚀 Getting started

```bash
# 1. Install dependencies
bun install        # or: npm install

# 2. Configure environment
cp .env.example .env
# → set AUTH_SECRET to any long random string

# 3. Create the database (auto-seeds packages + gift codes on first run)
bun run db:push   # or: npx prisma db push

# 4. Start the dev server
bun run dev       # or: npm run dev
```

Open **http://localhost:3000**, enter any email or Kenyan phone number, and create your key to the vault.

### Production build

```bash
bun run build
bun run start
```

## ⚙️ Platform rules (as presented in-app)

- Sign-up bonus: **KES 100** (credited automatically)
- Minimum package stake: **KES 1,200**
- Minimum withdrawal: **KES 250** · maximum **KES 25,000** per transaction
- Withdrawal fee: **16%**
- Referral commissions: **12% (L1) + 5% (L2) + 3% (L3)** of stake, credited instantly
- Withdrawal window: **9:00 AM – 7:00 PM EAT** · deposits open 24/7
- Withdrawals processed automatically within **0–12 hours**
- Gift codes released daily at **5:00 PM**
- Daily check-in: **KES 5–15** every 24 hours

## 📁 Project structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # KeshVault app entry
│   ├── layout.tsx          # Inter font + metadata
│   ├── globals.css         # dark-luxury design tokens
│   └── api/                # auth, session, packages, orders,
│                           # withdraw, recharge, records, team,
│                           # checkin, gift, coupons, preferences,
│                           # reset-password, withdraw-account
├── components/kv/
│   ├── AppShell.tsx        # session gate + view router
│   ├── LoginScreen.tsx     # adaptive "Enter the Vault"
│   ├── screens/            # Home, Products, Income, Team, Mine,
│   │                       # Withdraw, Recharge, Records, Coupon,
│   │                       # Influencer, Bonus, accounts
│   ├── modals/             # Welcome, How-it-works, About, PurchaseSheet
│   └── shared/             # BottomNav, tickers, buttons, pills
├── lib/                    # api client, auth, settlement engine,
│                           # seed catalogue, id generators
└── store/                  # Zustand navigation store
prisma/schema.prisma        # database schema
public/cars/                # package photography
```

## 🗄 Data model

- **User** — identity (email/phone), hashed password, invite code, referral chain, balance
- **Package** — catalogue with economics + purchase limits
- **Order** — activated package with payout ledger (`totalPaidOut`)
- **Transaction** — every wallet movement with status + reference
- **Coupon / GiftCode** — redeemable vouchers

The settlement engine (`src/lib/settle.ts`) runs on each session fetch: it credits due daily returns, expires completed packages and settles pending withdrawals — fully idempotent.

---

*KeshVault · Secure M-Pesa deposits and withdrawals.*
