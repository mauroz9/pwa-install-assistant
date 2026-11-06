import { en, type Messages } from "../locales/en";
import { es } from "../locales/es";

export type { Messages };

/** Any part of the messages, to override some texts. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** Packs bundled with the main entry. The rest come from `pwa-install-assistant/locales/*`. */
export const BUILT_IN_LOCALES: Readonly<Record<string, Messages>> = { en, es };

/** Fills `{name}` placeholders. Unknown placeholders are left as they are. */
export function fill(template: string, vars: Record<string, string | number | undefined> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep merge of an override over a pack (arrays are replaced, not merged). */
export function mergeMessages(base: Messages, override?: DeepPartial<Messages> | null): Messages {
  if (!override) return base;
  const merge = (a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...a };
    for (const [key, value] of Object.entries(b)) {
      if (value === undefined) continue;
      out[key] =
        isPlainObject(value) && isPlainObject(a[key]) ? merge(a[key] as Record<string, unknown>, value) : value;
    }
    return out;
  };
  return merge(base as unknown as Record<string, unknown>, override as Record<string, unknown>) as unknown as Messages;
}

/**
 * Picks the pack. `locale` is a pack, a language code (`"es"`, `"pt-BR"`) or
 * `"auto"` (default: the first of `navigator.languages` that has a pack).
 * Falls back to English.
 */
export function resolveLocale(locale: string | Messages | undefined, extra: readonly Messages[] = []): Messages {
  if (locale && typeof locale === "object") return locale;
  const packs: Record<string, Messages> = { ...BUILT_IN_LOCALES };
  for (const pack of extra) packs[pack.locale] = pack;
  const wanted =
    !locale || locale === "auto"
      ? typeof navigator !== "undefined"
        ? [...(navigator.languages ?? []), navigator.language].filter(Boolean)
        : []
      : [locale];
  for (const code of wanted) {
    const lower = code.toLowerCase();
    if (packs[lower]) return packs[lower];
    const base = lower.split("-")[0];
    if (packs[base]) return packs[base];
  }
  return en;
}
