import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentLanguage,
  setLanguage,
  toggleLanguage,
  t,
  type Language,
  type UseI18nReturn,
} from '@/lib/i18n';

/**
 * i18n React Hook
 * 用于在组件中获取和切换语言
 *
 * @example
 * const { lang, t, setLang, toggleLang } = useI18n();
 * return <h1>{t('hero.title')}</h1>;
 */
export function useI18n(): UseI18nReturn {
  const [lang, setLangState] = useState<Language>(getCurrentLanguage());

  // 监听语言变化事件
  useEffect(() => {
    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: Language }>;
      setLangState(customEvent.detail.lang);
    };

    window.addEventListener('languagechange', handleLanguageChange);

    // 监听 storage 事件（跨标签页同步）
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'preferred-lang' && e.newValue) {
        const newLang = e.newValue as Language;
        if (newLang !== lang) {
          setLangState(newLang);
          document.documentElement.lang = newLang;
          document.documentElement.setAttribute('data-lang', newLang);
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLanguage(newLang);
    setLangState(newLang);
  }, []);

  const toggleLang = useCallback(() => {
    const newLang = toggleLanguage();
    setLangState(newLang);
    return newLang;
  }, []);

  const translate = useCallback(
    (key: string, replacements?: Record<string, string>) => t(key, replacements),
    [],
  );

  return {
    lang,
    t: translate,
    setLang,
    toggleLang,
  };
}
