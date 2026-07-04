// app/settings/_layout.tsx
// Settings is presented as a modal from the root stack; give it its own stack
// so sub-screens (profile, …) push within the modal.
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />;
}
