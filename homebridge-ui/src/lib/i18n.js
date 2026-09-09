import { createI18n } from 'vue-i18n';
import { useHomebridge } from '../composables/useHomebridge';
import en from '../locales/en.json';

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
  },
});

const localesMap = import.meta.glob(['../locales/*.json', '!../locales/en.json']);

export async function setupI18n(app) {
  const { hb } = useHomebridge();
  app.use(i18n);

  try {
    const hbLang = await hb?.i18nCurrentLang();
    const cleanLang = hbLang?.split('-')[0]?.toLowerCase();

    if (!cleanLang || cleanLang === i18n.global.locale.value) {
      return;
    }

    if (i18n.global.availableLocales.includes(cleanLang)) {
      i18n.global.locale.value = cleanLang;
      return;
    }

    const matchedPath = Object.keys(localesMap).find((path) => path.endsWith(`/${cleanLang}.json`));

    if (matchedPath) {
      const module = await localesMap[matchedPath]();
      i18n.global.setLocaleMessage(cleanLang, module.default);
      i18n.global.locale.value = cleanLang;
    }
  } catch {}
}
