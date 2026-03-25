import { useOnboardingStore } from '../../store/onboardingStore';
import Step1Welcome from './steps/Step1Welcome';
import Step2SaveTab from './steps/Step2SaveTab';
import Step3AddContent from './steps/Step3AddContent';
import Step4DragItem from './steps/Step4DragItem';
import Step5ProTip from './steps/Step5ProTip';
import Step6Done from './steps/Step6Done';

/**
 * Root onboarding orchestrator.
 * Renders the active step component layered on top of the real product.
 */
export default function OnboardingOverlay() {
  const step = useOnboardingStore((s) => s.step);
  const dismissed = useOnboardingStore((s) => s.dismissed);
  const isHydrated = useOnboardingStore((s) => s.isHydrated);
  const advanceStep = useOnboardingStore((s) => s.advanceStep);
  const dismissOnboarding = useOnboardingStore((s) => s.dismissOnboarding);

  if (!isHydrated || dismissed) return null;

  const commonProps = {
    onComplete: advanceStep,
    onSkip: dismissOnboarding,
  };

  switch (step) {
    case 1: return <Step1Welcome {...commonProps} />;
    case 2: return <Step2SaveTab {...commonProps} />;
    case 3: return <Step3AddContent {...commonProps} />;
    case 4: return <Step4DragItem {...commonProps} />;
    case 5: return <Step5ProTip {...commonProps} />;
    case 6: return <Step6Done onComplete={advanceStep} />;
    default: return null;
  }
}
