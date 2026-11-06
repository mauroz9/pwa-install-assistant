/**
 * Local marks of the assistant. Never sent anywhere. With `storage: "none"`
 * nothing is remembered and everything still works.
 */
import { SAFARI_BARS, type SafariBar } from "./spots";

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string | null): void;
}

export type StorageOption = "localStorage" | "sessionStorage" | "none" | StorageAdapter;

/** What the assistant remembers (key suffixes after the prefix). */
export const MARKS = {
  /** "1" when the browser says it was installed (`appinstalled`) or the person confirms it. */
  installed: "installed",
  /** "1" once the last step of the guide (or the arrow) has been reached. */
  guideSeen: "guide-seen",
  /** Safari 26 toolbar layout ("compact", "bottom" or "top"), asked once. */
  safariBar: "safari-bar",
  /** Epoch ms when the person closed the modal or sheet. */
  dismissedAt: "dismissed-at",
} as const;

export type Mark = keyof typeof MARKS;

function webStorage(kind: "localStorage" | "sessionStorage"): StorageAdapter {
  const store = (): Storage | null => {
    try {
      return typeof window === "undefined" ? null : window[kind];
    } catch {
      // Old private Safari, or storage blocked.
      return null;
    }
  };
  return {
    get(key) {
      try {
        return store()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        if (value === null) store()?.removeItem(key);
        else store()?.setItem(key, value);
      } catch {
        // Without storage it works the same; it only does not remember.
      }
    },
  };
}

const NONE: StorageAdapter = { get: () => null, set: () => {} };

export function resolveStorage(option: StorageOption = "localStorage"): StorageAdapter {
  if (option === "none") return NONE;
  if (option === "localStorage" || option === "sessionStorage") return webStorage(option);
  return {
    get(key) {
      try {
        return option.get(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        option.set(key, value);
      } catch {
        /* the adapter failed: not remembered */
      }
    },
  };
}

/** Typed access to the marks, under `prefix` (default `pwa-install`). */
export function createMarks(adapter: StorageAdapter, prefix = "pwa-install") {
  const key = (mark: Mark) => `${prefix}.${MARKS[mark]}`;
  return {
    flag: (mark: "installed" | "guideSeen") => adapter.get(key(mark)) === "1",
    setFlag: (mark: "installed" | "guideSeen", value: boolean) => adapter.set(key(mark), value ? "1" : null),
    safariBar: (): SafariBar | null => {
      const value = adapter.get(key("safariBar"));
      return SAFARI_BARS.find((bar) => bar === value) ?? null;
    },
    setSafariBar: (value: SafariBar | null) => adapter.set(key("safariBar"), value),
    dismissedAt: (): number | null => {
      const value = Number(adapter.get(key("dismissedAt")));
      return Number.isFinite(value) && value > 0 ? value : null;
    },
    setDismissedAt: (value: number | null) => adapter.set(key("dismissedAt"), value === null ? null : String(value)),
  };
}

export type Marks = ReturnType<typeof createMarks>;
