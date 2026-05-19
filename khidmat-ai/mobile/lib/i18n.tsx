import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { strings, t as translate, type Lang } from '../constants/i18n';
import { api } from '../api/client';
import { getLang, getSession, setLang as persistLang } from './auth';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: (key: keyof (typeof strings)['en']) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    getLang().then(setLangState);
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    await persistLang(l);
    setLangState(l);
    const session = await getSession();
    if (session?.userId) {
      try {
        await api.patch(`/api/users/${session.userId}`, { language_pref: l });
      } catch {
        /* offline or guest */
      }
    }
  }, []);

  const t = useCallback((key: keyof (typeof strings)['en']) => translate(lang, key), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n requires I18nProvider');
  return ctx;
}
