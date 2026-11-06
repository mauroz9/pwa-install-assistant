// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { de } from "../src/locales/de";
import { en } from "../src/locales/en";
import { es } from "../src/locales/es";
import { fr } from "../src/locales/fr";
import { it as itPack } from "../src/locales/it";
import { pt } from "../src/locales/pt";
import { buildGuide, STEP_GUIDES } from "../src/ui/guides";
import { fill, mergeMessages, resolveLocale } from "../src/ui/i18n";

const PACKS = { en, es, pt, fr, de, it: itPack };
const shape = (o: unknown): unknown =>
  Array.isArray(o)
    ? `array:${o.length && typeof o[0]}`
    : typeof o === "object" && o
      ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)]))
      : typeof o;
const strings = (o: unknown): string[] =>
  typeof o === "string"
    ? [o]
    : Array.isArray(o) || (typeof o === "object" && o)
      ? Object.values(o as object).flatMap(strings)
      : [];
const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("language packs", () => {
  it.each(Object.entries(PACKS))("%s has exactly the English keys", (code, pack) => {
    expect(shape(pack)).toEqual(shape(en));
    expect(pack.locale).toBe(code);
  });

  it.each(Object.entries(PACKS))("%s uses the same placeholders as English in every text", (_code, pack) => {
    const ours = strings(pack);
    const theirs = strings(en);
    expect(ours.length).toBe(theirs.length);
    ours.forEach((text, i) => expect(placeholders(text), `${text} ↔ ${theirs[i]}`).toEqual(placeholders(theirs[i])));
  });

  it.each(Object.entries(PACKS))("%s: every guide builds with no unfilled placeholder", (_code, pack) => {
    for (const key of STEP_GUIDES) {
      const guide = buildGuide(key, pack, "Acme");
      for (const text of [guide.label, ...guide.help, ...guide.steps.flatMap((s) => [s.title, s.text, s.alt])]) {
        expect(text, `${key}: ${text}`).not.toMatch(/\{\w+\}/);
      }
      for (const step of guide.steps)
        if (step.scene.kind === "sheet") expect(step.scene.highlight, `${key} ${step.title}`).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(Object.entries(PACKS))(
    "%s: the Share sheet lists the «Add to Home Screen» label it quotes",
    (_code, pack) => {
      expect(pack.browser.ios.shareItems).toContain(pack.browser.ios.addToHome);
      expect(pack.browser.ios.menuItems).toContain(pack.browser.ios.share);
      expect(pack.browser.chrome.menuItems).toContain(pack.browser.chrome.installApp);
      expect(pack.browser.samsung.targets).toContain(pack.browser.samsung.homeScreen);
    },
  );
});

describe("resolveLocale", () => {
  it("codes, regional codes, packs and the English fallback", () => {
    expect(resolveLocale("es").locale).toBe("es");
    expect(resolveLocale("es-MX").locale).toBe("es");
    expect(resolveLocale("fr").locale).toBe("en"); // not bundled unless passed
    expect(resolveLocale("fr", [fr]).locale).toBe("fr");
    expect(resolveLocale("pt-BR", [pt]).locale).toBe("pt");
    expect(resolveLocale(de).locale).toBe("de");
  });

  it("auto: the first of the browser's languages that has a pack", () => {
    Object.defineProperty(navigator, "languages", { value: ["it-IT", "es-ES"], configurable: true });
    expect(resolveLocale("auto").locale).toBe("es");
    expect(resolveLocale("auto", [itPack]).locale).toBe("it");
    expect(resolveLocale(undefined, [itPack]).locale).toBe("it");
  });

  it("messages override deep keys and replace arrays", () => {
    const m = mergeMessages(en, { common: { next: "Go" }, browser: { ios: { shareItems: ["A"] } } });
    expect(m.common.next).toBe("Go");
    expect(m.common.back).toBe("Back");
    expect(m.browser.ios.shareItems).toEqual(["A"]);
    expect(en.common.next).toBe("Next");
  });

  it("fill leaves unknown placeholders alone", () => {
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});
