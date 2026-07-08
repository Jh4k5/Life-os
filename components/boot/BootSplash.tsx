// components/boot/BootSplash.tsx
// ─────────────────────────────────────────────────────────────
// LIFE OS AI — boot animation v2 (approved motion)
// Narrative: core ignites → platinum strands grow → nodes spark
// (sky flash → settle platinum) → wordmark settles → exhale. ~2.9s.
// Identity: deep-indigo canvas, platinum rosette, white core,
// sky-blue (#9CCCFF) as a transient living accent only.
// Respects Reduce Motion. Always skippable by tap.
//
// NOTE: the rosette here is the approved stylized motion version
// (6 outer strands + 6 inner, 2-layer). When the final vector of
// the official logo is extracted, swap the <Path d=...> data only —
// the animation rig stays identical.
//
// Usage (app/_layout.tsx, once per cold start):
//   const [booted, setBooted] = useState(false);
//   {!booted && <BootSplash onDone={() => setBooted(true)} />}
//
// Deps: react-native-reanimated (in repo), react-native-svg.
// ─────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const INDIGO_0 = '#0A1128';
const PLATINUM = '#D8DAE0';
const SKY = '#9CCCFF';

const OUTER_D = 'M150 116 C176 108 200 118 208 142 C214 162 205 181 187 189';
const INNER_D = 'M150 126 C166 122 180 130 184 146 C187 159 181 171 169 176';
const PATH_LEN = 100; // normalized via pathLength-style dasharray

const out = Easing.bezier(0.22, 1, 0.36, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const overshoot = Easing.bezier(0.34, 1.56, 0.64, 1);

const OUTER_ROT = [0, 60, 120, 180, 240, 300];
const INNER_ROT = [30, 90, 150, 210, 270, 330];

export default function BootSplash({ onDone }: { onDone: () => void }) {
  // one progress value per strand / node keeps the rig simple & performant
  const outer = OUTER_ROT.map(() => useSharedValue(0));
  const inner = INNER_ROT.map(() => useSharedValue(0));
  const nodes = OUTER_ROT.map(() => useSharedValue(0));
  const core = useSharedValue(0);
  const breath = useSharedValue(1);
  const spin = useSharedValue(0);   // rosette -28deg → 0
  const word = useSharedValue(0);
  const settle = useSharedValue(1);
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
        core.value = 1; spin.value = 1; word.value = 1;
        outer.forEach(v => (v.value = 1));
        inner.forEach(v => (v.value = 1));
        nodes.forEach(v => (v.value = 1));
        setTimeout(finish, 900);
        return;
      }
      // 1 · core ignites
      core.value = withDelay(100, withTiming(1, { duration: 800, easing: out }));
      breath.value = withDelay(1600,
        withRepeat(withSequence(
          withTiming(1.12, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,  { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ), -1));
      // rosette wakes: rotate -28° → 0 while strands draw
      spin.value = withDelay(350, withTiming(1, { duration: 1600, easing: out }));
      // 2 · strands grow (staggered)
      outer.forEach((v, i) =>
        (v.value = withDelay(450 + i * 100, withTiming(1, { duration: 1100, easing: inOut }))));
      inner.forEach((v, i) =>
        (v.value = withDelay(700 + i * 100, withTiming(1, { duration: 1100, easing: inOut }))));
      // 3 · nodes spark (sky flash → platinum, with overshoot)
      nodes.forEach((v, i) =>
        (v.value = withDelay(1300 + i * 80, withTiming(1, { duration: 500, easing: overshoot }))));
      // 4 · wordmark settles
      word.value = withDelay(1850, withTiming(1, { duration: 1000, easing: out }));
      // 5 · exhale, then hand over
      settle.value = withDelay(2600, withTiming(0.985, { duration: 500, easing: out }));
      const t = setTimeout(finish, 3150);
      return () => clearTimeout(t);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageStyle = useAnimatedStyle(() => ({
    opacity: fadeAll.value,
    transform: [{ scale: settle.value }],
  }));
  const rosetteStyle = useAnimatedStyle(() => ({
    opacity: spin.value,
    transform: [{ rotate: `${-28 * (1 - spin.value)}deg` }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    opacity: core.value,
    transform: [{ scale: (0.2 + 0.8 * core.value) * breath.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: core.value * 0.55,
    transform: [{ scale: breath.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: 10 * (1 - word.value) }],
    letterSpacing: 10 - 6 * word.value,
  }));

  const mkStrandProps = (p: SharedValue<number>) =>
    useAnimatedProps(() => ({ strokeDashoffset: PATH_LEN * (1 - p.value) }));
  const mkNodeProps = (p: SharedValue<number>) =>
    useAnimatedProps(() => {
      // overshoot scale is baked into easing; color: sky → platinum
      const r = 8 * Math.min(p.value * 1.15, 1);
      return {
        r,
        fill: interpolateColor(p.value, [0, 0.6, 1], [SKY, SKY, PLATINUM]),
      };
    });

  const outerProps = outer.map(mkStrandProps);
  const innerProps = inner.map(mkStrandProps);
  const nodeProps = nodes.map(mkNodeProps);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityLabel="LIFE OS AI">
      <Animated.View style={[styles.root, stageStyle]}>
        <Animated.View style={[styles.mark]}>
          <Animated.View style={[StyleSheet.absoluteFill, rosetteStyle]}>
            <Svg width={220} height={220} viewBox="0 0 300 300">
              <Defs>
                <LinearGradient id="plat" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#E6E8EE" />
                  <Stop offset="0.55" stopColor="#C9CCD6" />
                  <Stop offset="1" stopColor="#8F94A2" />
                </LinearGradient>
              </Defs>
              {OUTER_ROT.map((deg, i) => (
                <G key={`o${i}`} rotation={deg} origin="150,150">
                  <AnimatedPath
                    d={OUTER_D} stroke="url(#plat)" strokeWidth={9}
                    strokeLinecap="round" fill="none"
                    strokeDasharray={`${PATH_LEN}`} animatedProps={outerProps[i]}
                    // @ts-expect-error pathLength is valid SVG, typing lags
                    pathLength={PATH_LEN}
                  />
                  <AnimatedCircle cx={187} cy={189} animatedProps={nodeProps[i]} />
                </G>
              ))}
              {INNER_ROT.map((deg, i) => (
                <G key={`i${i}`} rotation={deg} origin="150,150">
                  <AnimatedPath
                    d={INNER_D} stroke="url(#plat)" strokeWidth={7} opacity={0.85}
                    strokeLinecap="round" fill="none"
                    strokeDasharray={`${PATH_LEN}`} animatedProps={innerProps[i]}
                    // @ts-expect-error pathLength typing
                    pathLength={PATH_LEN}
                  />
                </G>
              ))}
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.halo, haloStyle]} />
          <Animated.View style={[styles.core, coreStyle]} />
        </Animated.View>

        <Animated.View style={wordStyle}>
          <Text style={styles.word}>
            LIFE OS <Text style={styles.ai}>AI</Text>
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: INDIGO_0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  mark: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  core: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: SKY, shadowOpacity: 0.9, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  halo: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(156,204,255,0.18)',
  },
  word: { color: PLATINUM, fontSize: 26, fontWeight: '700' },
  ai: { color: SKY, fontWeight: '800' },
});
