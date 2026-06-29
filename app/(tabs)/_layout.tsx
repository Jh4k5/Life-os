// app/(tabs)/_layout.tsx
import { View } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { TabBar } from '@/components/layout/TabBar';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();

  const current = pathname.startsWith('/more') ? 'more' : 'home';

  const navigate = (key: string) => {
    if (key === 'home') router.push('/(tabs)/home');
    else router.push('/(tabs)/more');
  };

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <TabBar current={current} onPress={navigate} />
    </View>
  );
}
