import en from "./locales/en.json";
import fr from "./locales/fr.json";
import mk from "./locales/mk.json";

const translations = {
  en,
  fr,
  mk,
} as const; // Use 'as const' for stricter typing

export type Language = keyof typeof translations;

// Helper type to flatten keys with dot notation
type FlattenKeys<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${K & string}`
    : FlattenKeys<T[K], `${Prefix}${K & string}.`>;
}[keyof T];

export type TranslationKey = FlattenKeys<typeof en>; // Generate flattened keys like "home.title"

const defaultLang: Language = "en"; // Set your default language here

// Helper function to get nested values using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

export function useTranslations(lang: Language | undefined) {
  const currentLang = lang && lang in translations ? lang : defaultLang;
  const currentTranslations = translations[currentLang];
  const defaultTranslations = translations[defaultLang];

  return function t(key: TranslationKey): string {
    const currentVal = getNestedValue(currentTranslations, key);
    const defaultVal = getNestedValue(defaultTranslations, key);
    return currentVal ?? defaultVal ?? key; // Use nullish coalescing
  };
}
