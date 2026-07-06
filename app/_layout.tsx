// app/_layout.tsx
import '@/global.css';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';
import { useSettingsStore } from '@/store/settingsStore';
import { installTextScaling } from '@/lib/textScale';
import BootSplash from '@/components/boot/BootSplash';
import '@/lib/i18n';

// Patch <Text>/<TextInput> once so the Font-size setting scales all text.
installTextScaling();

export default function RootLayout() {
  // Re-key the tree when the font scale changes so it applies immediately.
  const fontSize = useSettingsStore((s) => s.fontSize);
  // Shown once per cold start, above everything, then unmounted for good.
  const [booted, setBooted] = useState(false);
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} key={fontSize}>
        {/* Honor the OS "Reduce Motion" accessibility setting app-wide. */}
        <ReducedMotionConfig mode={ReduceMotion.System} />
        <SafeAreaProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="settings"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="trust-center"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="search"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </ThemeProvider>
        </SafeAreaProvider>
        {!booted && <BootSplash onDone={() => setBooted(true)} />}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
