import { useEffect } from 'react';
import { useBoardStore } from './store/boardStore';
import { useStorageSync } from './hooks/useStorageSync';
import { useOnboardingSync } from './hooks/useOnboardingSync';
import { triggerFlash } from './lib/flash';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import OnboardingOverlay from './components/onboarding/OnboardingOverlay';

export default function App() {
  const hydrate = useBoardStore((s) => s.hydrate);
  const isHydrated = useBoardStore((s) => s.isHydrated);
  const pendingFlashIds = useBoardStore((s) => s.pendingFlashIds);

  useStorageSync();
  useOnboardingSync();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Trigger flash for items that were repositioned from sentinel on hydration.
  // Runs after isHydrated → true, meaning Canvas is now mounted and subscriptions are live.
  useEffect(() => {
    if (isHydrated && pendingFlashIds.length > 0) {
      pendingFlashIds.forEach((id) => triggerFlash(id));
    }
  }, [isHydrated, pendingFlashIds]);

  if (!isHydrated) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar />
      <Canvas />
      <OnboardingOverlay />
    </div>
  );
}
