// i18n markazi: tillar ro'yxati, lug'atlar va serverdan kelgan kontentdan
// kerakli tildagi maydonni olish yordamchilari.
import uz from './uz';
import ru from './ru';
import uzCyrl from './uz-Cyrl';

/** URL segmenti -> ichki locale kodi */
export const LOCALES = ['uz', 'ru', 'uz-cyrl'];
export const DEFAULT_LOCALE = 'uz';

/** URL'dagi segment (uz-cyrl) va DB'dagi kod (uz-Cyrl) o'rtasidagi moslik */
export const toDbLocale = (urlLocale) => (urlLocale === 'uz-cyrl' ? 'uz-Cyrl' : urlLocale);
export const toUrlLocale = (dbLocale) => (dbLocale === 'uz-Cyrl' ? 'uz-cyrl' : dbLocale);

const dictionaries = { uz, ru, 'uz-cyrl': uzCyrl };

/** Berilgan til uchun lug'at (noto'g'ri kod kelsa — uz) */
export function getDict(locale) {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function isValidLocale(locale) {
  return LOCALES.includes(locale);
}

/**
 * Serverdan kelgan obyektdan tilga mos maydonni olish.
 * Masalan pick(product, 'name', 'ru') -> product.nameRu
 * Bo'sh bo'lsa — uz variantiga qaytamiz (kontent hali kiritilmagan bo'lishi mumkin).
 */
export function pick(obj, field, locale) {
  if (!obj) return '';
  const suffix = locale === 'ru' ? 'Ru' : locale === 'uz-cyrl' ? 'UzCyrl' : 'Uz';
  const key = field + suffix;
  return obj[key] || obj[field + 'Uz'] || obj[field + 'Ru'] || '';
}

/** hreflang teglari uchun tillar xaritasi */
export const HREFLANG_MAP = {
  uz: 'uz-UZ',
  ru: 'ru-UZ',
  'uz-cyrl': 'uz-Cyrl-UZ',
};

/** Til nomlari (almashtirgich uchun) */
export const LOCALE_LABELS = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'uz-cyrl', label: 'Ўзбекча', short: 'ЎЗ' },
];
