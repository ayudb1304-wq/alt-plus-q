import { useEffect } from 'react';
import { useOnboardingStore, ONBOARDING_STORAGE_KEY } from '../store/onboardingStore';

export function useOnboardingSync() {
  useEffect(() => {
    useOnboardingStore.getState().hydrate();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = useOnboardingStore.subscribe(
      (s) => ({
        step: s.step,
        dismissed: s.dismissed,
        version: s.version,
      }),
      (state) => {
        if (!useOnboardingStore.getState().isHydrated) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          chrome.storage.local.set({ [ONBOARDING_STORAGE_KEY]: state });
        }, 300);
      },
      {
        equalityFn: (a, b) =>
          a.step === b.step &&
          a.dismissed === b.dismissed &&
          a.version === b.version,
      }
    );

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsub();
    };
  }, []);
}
