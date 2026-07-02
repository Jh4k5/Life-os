// components/system/ErrorBoundary.tsx
// Last line of defense at the root of the app. A JavaScript error thrown during
// render/lifecycle would otherwise hard-crash a *release* build ("keeps
// stopping") with no message. This catches it, logs a greppable marker to
// logcat (LIFEOS-CRASH ...), and shows the actual error on screen so it can be
// read/screenshotted instead of vanishing. Intentionally theme-free and
// dependency-free — it must render even if the theme/i18n/native layers are
// what failed.
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
  info: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Greppable in `adb logcat` (tag ReactNativeJS) and by CI diagnostics.
    // eslint-disable-next-line no-console
    console.error('LIFEOS-CRASH:', error?.message, '\n', error?.stack, '\n', info?.componentStack);
    this.setState({ info: info?.componentStack ?? null });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#06080F', padding: 24, paddingTop: 80 }}>
        <Text style={{ color: '#FF6B6B', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>
          Life OS — startup error
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 15, marginBottom: 16 }}>
          {String(error?.message ?? error)}
        </Text>
        <ScrollView style={{ flex: 1 }}>
          <Text style={{ color: '#9AA4B2', fontSize: 12, lineHeight: 18 }}>
            {error?.stack ?? ''}
            {info ?? ''}
          </Text>
        </ScrollView>
      </View>
    );
  }
}
