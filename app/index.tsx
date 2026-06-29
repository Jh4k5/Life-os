// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // Frontend فقط: دائماً للـ tabs
  // عند إضافة Auth: تحقق من session → redirect
  return <Redirect href="/(tabs)/home" />;
}
