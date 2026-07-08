// hooks/useDensity.ts
// Turns the user's Layout-density preference into a live multiplier that
// components multiply their spacing/padding by. Reactive: changing the
// preference in Settings re-renders every consumer immediately.
import { useSettingsStore } from '@/store/settingsStore';
import { density as densityScale } from '@/tokens/spacing';

/** The active layout-density multiplier (compact .85 / default 1 / spacious 1.2). */
export const useDensity = (): number => {
  const d = useSettingsStore((s) => s.density);
  return densityScale[d] ?? densityScale.default;
};
