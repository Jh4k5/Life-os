# Live OS — AGENTS.md v3

## المشروع
React Native + Expo SDK 54 | Frontend فقط | Mock Data | لا Backend

## قانون أساسي لا يُخرق
- Journal  (اليوميات) → `more/journal/`  ← مستقل تماماً
- Study    (الدراسة)  → `more/study/`    ← مستقل تماماً
- Learning (التعلم)   → `more/learning/` ← مستقل تماماً
- Projects            → داخل Areas (`more/areas/[id]/`) فقط

## الأقسام العشرة في More
areas, habits, tasks, journal, study, learning, focus, schedule, dopamine, ai_hub

## الألوان (من useTheme)
c.areas / c.habits / c.tasks / c.journal / c.study /
c.learning / c.focus / c.schedule / c.dopamine / c.ai_hub
c.t1 / c.t2 / c.t3 / c.bg0 / c.bg1 / c.accent

## الحزم
- expo-speech-recognition (لا expo-av)
- zustand للـ state
- i18next للغات
- react-native-reanimated v3+ للـ animations

## قواعد الكود
- ✅ marginStart/End   ❌ marginLeft/Right
- ✅ t('key')          ❌ نص عربي مباشر
- ✅ c.xxx             ❌ hardcoded colors
- ✅ SmartCard         ← يتعامل dark/light تلقائياً
- ✅ commit بعد كل خطوة

## ملاحظة على الإصدارات
الـ package.json في الـ prompt الأصلي كان به تعارض (SDK 54 مع RN 0.76.7).
تم محاذاة الإصدارات إلى مجموعة Expo SDK 54 الحقيقية القابلة للتثبيت (RN 0.81 / React 19 /
expo-router 6 / reanimated 4) لضمان أن التطبيق يبني فعلياً.
