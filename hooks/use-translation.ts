import { useOnboardingStore } from '@/store/onboarding-store';
import { TRANSLATIONS, TranslationKey } from '@/constants/translations';

export function useTranslation() {
  const { language, set } = useOnboardingStore();

  const t = (key: TranslationKey) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  const toggleLanguage = () => {
    set({ language: language === 'en' ? 'pidgin' : 'en' });
  };

  return { t, language, toggleLanguage };
}
