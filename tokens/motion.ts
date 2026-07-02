// tokens/motion.ts
// One rhythm for the whole app (ui-ux-pro-max: motion-consistency). Every
// animation draws its duration, easing, spring, and stagger from here so the
// product feels like one physical system — Liquid Glass, spring-based, calm.
// Micro-interactions stay 150–320ms; enters use spring; exits are shorter.

export const motion = {
  duration: {
    fast: 150, // press / small state changes
    base: 220, // enters, crossfades
    slow: 320, // larger transitions
    exit: 150, // exits ≈ 65% of enter (feels responsive)
  },
  /** Per-item delay when staggering a list/section reveal (30–50ms). */
  stagger: 45,
  /** Default settle spring for entrances & layout. */
  spring: { damping: 20, stiffness: 210, mass: 0.9 },
  /** Softer spring for large surfaces (sheets, hero). */
  springSoft: { damping: 24, stiffness: 150, mass: 1 },
  /** Snappy spring for press feedback. */
  springPress: { damping: 15, stiffness: 320 },
  /** Scale applied on press for tappable cards/buttons (0.95–1.05 band). */
  pressScale: 0.97,
};

/** Stagger helper: entering delay for the Nth item in a sequence. */
export const stagger = (index: number, step = motion.stagger) => index * step;
