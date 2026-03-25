import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const CURRENT_ONBOARDING_VERSION = 2;
export const ONBOARDING_STORAGE_KEY = 'altq_onboarding';
export const TOTAL_STEPS = 6;

interface OnboardingStore {
  step: number;
  dismissed: boolean;
  version: number;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  advanceStep: () => void;
  dismissOnboarding: () => void;
}

const DEFAULT_STATE = {
  step: 1,
  dismissed: false,
  version: CURRENT_ONBOARDING_VERSION,
};

export const useOnboardingStore = create<OnboardingStore>()(
  subscribeWithSelector((set, get) => ({
    ...DEFAULT_STATE,
    isHydrated: false,

    hydrate: async () => {
      const result = await chrome.storage.local.get(ONBOARDING_STORAGE_KEY);
      const stored = result[ONBOARDING_STORAGE_KEY] as typeof DEFAULT_STATE | undefined;

      if (stored && stored.version >= CURRENT_ONBOARDING_VERSION) {
        set({
          step: stored.step ?? 1,
          dismissed: stored.dismissed ?? false,
          version: stored.version,
          isHydrated: true,
        });
      } else {
        set({ ...DEFAULT_STATE, isHydrated: true });
      }
    },

    advanceStep: () => {
      const { step } = get();
      if (step >= TOTAL_STEPS) {
        set({ dismissed: true });
      } else {
        set({ step: step + 1 });
      }
    },

    dismissOnboarding: () => {
      set({ dismissed: true });
    },
  }))
);
