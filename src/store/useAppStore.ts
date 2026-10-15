"use client";

import { create } from "zustand";

export type TabKey = "home" | "products" | "income" | "team" | "mine";

export type SubView =
  | "withdraw"
  | "recharge"
  | "records"
  | "coupon"
  | "influencer"
  | "withdraw-account"
  | "reset-password"
  | "bonus"
  | null;

type ModalKey = "welcome" | "howitworks" | "about" | null;

interface AppState {
  tab: TabKey;
  subView: SubView;
  modal: ModalKey;
  // navigation direction for transitions: 1 = push (forward), -1 = pop (back)
  direction: 1 | -1;
  setTab: (tab: TabKey) => void;
  pushSub: (view: Exclude<SubView, null>) => void;
  popSub: () => void;
  openModal: (key: Exclude<ModalKey, null>) => void;
  closeModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  tab: "home",
  subView: null,
  modal: null,
  direction: 1,
  setTab: (tab) => set({ tab, subView: null, direction: 1 }),
  pushSub: (view) => set((s) => (s.subView === view ? s : { subView: view, direction: 1 })),
  popSub: () => set((s) => (s.subView === null ? s : { subView: null, direction: -1 })),
  openModal: (key) => set({ modal: key }),
  closeModal: () => set({ modal: null }),
}));
