// components/boot/BootSplash.tsx
// ─────────────────────────────────────────────────────────────
// Life OS AI — boot animation ("the exhale")
// Narrative: presence → listening → order → settle. ~2.6s total.
// Brand law: Obsidian canvas, Iris violet only (no gold — gold is earned,
// never given at boot). Respects Reduce Motion. Always skippable by tap.
//
// Usage (in app/_layout.tsx, above everything, once per cold start):
//   const [booted, setBooted] = useState(false);
//   {!booted && <BootSplash onDone={() => setBooted(true)} />}
//
// Deps: react-native-reanimated (already in repo), react-native-svg.
// ─────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const OBSIDIAN = '#0A0B0D';
const IRIS = '#7C6FFF';
const IRIS_LIGHT = '#9C92FF';
const TEXT = '#F5F5F7';
const TEXT_DIM = '#9C9FAA';

const RING_R = 42;
const RING_LEN = 2 * Math.PI * RING_R; // ≈ 264

const out = Easing.bezier(0.22, 1, 0.36, 1);   // calm decelerate
const inOut = Easing.bezier(0.65, 0, 0.35, 1); // ring draw

export default function BootSplash({ onDone }: { onDone: () => void }) {
  const core = useSharedValue(0);      // presence
  const breath = useSharedValue(1);
  const pulse1 = useSharedValue(0);    // listening
  const pulse2 = useSharedValue(0);
  const ring = useSharedValue(0);      // order
  const word = useSharedValue(0);      // name
  const tag = useSharedValue(0);
  const settle = useSharedValue(1);    // exhale
  const fadeAll = useSharedValue(1);

  const finish = () => {
    fadeAll.value = withTiming(0, { duration: 260, easing: out }, (f) => {
      if (f) runOnJS(onDone)();
    });
  };

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        // Show the settled final frame briefly, no motion.
        core.value = 1; ring.value = 1; word.value = 1; tag.value = 1;
        setTimeout(finish, 900);
        return;
      }
      // 1 · presence — the point breathes in
      core.value = withDelay(150, withTiming(1, { duration: 900, easing: out }));
      breath.value = withDelay(
        1050,
        withRepeat(
          withSequence(
            withTiming(1.14, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.0, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
        ),
      );
      // 2 · listening — two quiet pulses
      pulse1.value = withDelay(750, withTiming(1, { duration: 1150, easing: Easing.bezier(0.16, 0.84, 0.44, 1) }));
      pulse2.value = withDelay(1050, withTiming(1, { duration: 1150, easing: Easing.bezier(0.16, 0.84, 0.44, 1) }));
      // 3 · order — the ring draws itself
      ring.value = withDelay(1350, withTiming(1, { duration: 1000, easing: inOut }));
      // 4 · the name settles
      word.value = withDelay(1750, withTiming(1, { duration: 1000, easing: out }));
      tag.value = withDelay(2250, withTiming(1, { duration: 800, easing: out }));
      // 5 · exhale, then hand over to the app
      settle.value = withDelay(2500, withTiming(0.985, { duration: 500, easing: out }));
      const t = setTimeout(finish, 3050);
      return () => clearTimeout(t);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── styles ──
  const stageStyle = useAnimatedStyle(() => ({
    opacity: fadeAll.value,
    transform: [{ scale: settle.value }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    opacity: core.value,
    transform: [{ scale: (0.2 + 0.8 * core.value) * breath.value }],
  }));
  const auraStyle = useAnimatedStyle(() => ({
    opacity: core.value * 0.5,
    transform: [{ scale: breath.value }],
  }));
  const mkPulse = (p: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: p.value <= 0 ? 0 : p.value < 0.18 ? (p.value / 0.18) * 0.8 : 0.8 * (1 - (p.value - 0.18) / 0.82),
      transform: [{ scale: 1 + 6.5 * p.value }],
    }));
  const pulse1Style = mkPulse(pulse1);
  const pulse2Style = mkPulse(pulse2);
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_LEN * (1 - ring.value),
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: 10 * (1 - word.value) }],
    letterSpacing: 12 - 10 * word.value, // .42em → .06em feel
  }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value * 0.85 }));

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityLabel="Life OS AI">
      <Animated.View style={[styles.root, stageStyle]}>
        <View style={styles.center}>
          {/* ring of the day */}
          <Svg width={100} height={100} viewBox="0 0 100 100" style={styles.ring}>
            <Defs>
              <LinearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={IRIS_LIGHT} />
                <Stop offset="1" stopColor="#5B4FE0" />
              </LinearGradient>
            </Defs>
            <AnimatedCircle
              cx="50" cy="50" r={RING_R}
              stroke="url(#rg)" strokeWidth={2.5} strokeLinecap="round" fill="none"
              strokeDasharray={`${RING_LEN}`} animatedProps={ringProps}
              transform="rotate(-90 50 50)"
            />
          </Svg>
          {/* listening pulses */}
          <Animated.View style={[styles.pulse, pulse1Style]} />
          <Animated.View style={[styles.pulse, pulse2Style]} />
          {/* the presence */}
          <Animated.View style={[styles.aura, auraStyle]} />
          <Animated.View style={[styles.core, coreStyle]} />
        </View>

        <Animated.View style={wordStyle}>
          <Text style={styles.word}>
            Life OS <Text style={styles.ai}>AI</Text>
          </Text>
        </Animated.View>
        <Animated.Text style={[styles.tag, tagStyle]}>QUIET INTELLIGENCE</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OBSIDIAN,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  center: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 44 },
  ring: { position: 'absolute' },
  core: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    backgroundColor: IRIS,
  },
  aura: {
    position: 'absolute', width: 66, height: 66, borderRadius: 33,
    backgroundColor: 'rgba(124,111,255,0.22)',
  },
  pulse: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    borderWidth: 1.5, borderColor: 'rgba(156,146,255,0.55)',
  },
  word: { color: TEXT, fontSize: 30, fontWeight: '600' },
  ai: { color: IRIS_LIGHT, fontWeight: '800' },
  tag: { color: TEXT_DIM, fontSize: 11, fontWeight: '500', letterSpacing: 4, marginTop: 12 },
});
