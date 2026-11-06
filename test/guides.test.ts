import { describe, expect, it } from "vitest";
import { GUIDE_KEYS } from "../src/core/detect";
import { en } from "../src/locales/en";
import { es } from "../src/locales/es";
import { buildGuide, hasSteps, PICKER_GROUPS, STEP_GUIDES } from "../src/ui/guides";

const PACKS = { en, es };

describe("guides", () => {
  it.each(Object.entries(PACKS))("%s: every guide builds, with no unfilled placeholder", (_code, m) => {
    for (const key of STEP_GUIDES) {
      const guide = buildGuide(key, m, "Acme");
      expect(guide.steps.length, key).toBeGreaterThanOrEqual(4);
      const texts = [guide.label, ...guide.help, ...guide.steps.flatMap((s) => [s.title, s.text, s.alt])];
      for (const text of texts) {
        expect(text, `${key}: ${text}`).not.toMatch(/\{\w+\}/);
        expect(text.trim().length, key).toBeGreaterThan(0);
      }
    }
  });

  it("every step names the app where it should, and the highlight exists", () => {
    for (const key of STEP_GUIDES) {
      const guide = buildGuide(key, en, "Acme");
      const last = guide.steps[guide.steps.length - 1];
      expect(last.scene.kind).toBe("home");
      expect(last.text).toContain("Acme");
      for (const step of guide.steps) {
        if (step.scene.kind === "sheet")
          expect(step.scene.highlight, `${key}: ${step.title}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("iOS 26 guides go through «•••», «View More» and «Open as Web App»", () => {
    const iphone = buildGuide("iphone-safari-26", en, "Acme");
    expect(iphone.steps.map((s) => s.title)).toEqual([
      "Tap “•••”",
      "Tap “Share”",
      "Choose “Add to Home Screen”",
      "Leave “Open as Web App” on and tap “Add”",
      "Done: open it from its icon",
    ]);
    expect(iphone.steps[2].text).toContain("View More");
    const es26 = buildGuide("iphone-safari-26", es, "PlanABC");
    expect(es26.steps[1].text).toBe("Dentro del menú «•••» que se acaba de abrir.");
    expect(es26.steps[3].title).toBe("Deja «Abrir como app web» activado y toca «Añadir»");
  });

  it("Android texts quote the browser's labels, iOS texts quote iOS's", () => {
    expect(buildGuide("android-chrome", es, "X").steps[1].title).toBe("Toca «Instalar aplicación»");
    expect(buildGuide("android-chrome", es, "X").help[0]).toContain("«Añadir a pantalla de inicio»");
    expect(buildGuide("android-samsung", en, "X").steps[2].title).toBe("Choose “Home screen”");
    expect(buildGuide("iphone-safari", en, "X").help.join(" ")).toContain("“Edit Actions…”");
  });

  it("the picker lists every guide except the internal «open in Safari» one", () => {
    const keys = PICKER_GROUPS.flatMap((g) => g.keys).sort();
    expect(keys).toEqual(GUIDE_KEYS.filter((k) => k !== "ios-open-safari").sort());
    for (const key of keys) expect(hasSteps(key) || ["in-app", "desktop"].includes(key)).toBe(true);
  });

  it("the Spanish pack has exactly the English keys", () => {
    const shape = (o: unknown): unknown =>
      Array.isArray(o)
        ? "array"
        : typeof o === "object" && o
          ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)]))
          : typeof o;
    expect(shape(es)).toEqual(shape(en));
  });
});
