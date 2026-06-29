// hooks/useRTL.ts
import { useTranslation } from 'react-i18next';
import { RTL } from '@/lib/i18n';

export const useRTL = () => {
  const { i18n } = useTranslation();
  const isRTL = RTL.includes(i18n.language);
  return {
    isRTL,
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    rowDir: isRTL ? ('row-reverse' as const) : ('row' as const),
    flipIcon: isRTL ? -1 : 1,
  };
};
