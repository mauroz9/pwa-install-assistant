import { describe, expect, it } from "vitest";
import { createMarks, resolveStorage, type StorageAdapter } from "../src/core/storage";

function memory(): StorageAdapter & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: (k) => data.get(k) ?? null,
    set: (k, v) => void (v === null ? data.delete(k) : data.set(k, v)),
  };
}

describe("marks", () => {
  it("remembers the Safari toolbar layout under its key and forgets it", () => {
    const store = memory();
    const marks = createMarks(store);
    expect(marks.safariBar()).toBeNull();
    marks.setSafariBar("top");
    expect(store.data.get("pwa-install.safari-bar")).toBe("top");
    expect(marks.safariBar()).toBe("top");
    marks.setSafariBar("compact");
    expect(marks.safariBar()).toBe("compact");
    marks.setSafariBar(null);
    expect(marks.safariBar()).toBeNull();
  });

  it("ignores values that are not its own", () => {
    const store = memory();
    store.set("pwa-install.safari-bar", "left");
    store.set("pwa-install.dismissed-at", "yesterday");
    const marks = createMarks(store);
    expect(marks.safariBar()).toBeNull();
    expect(marks.dismissedAt()).toBeNull();
  });

  it("flags and a custom prefix", () => {
    const store = memory();
    const marks = createMarks(store, "myapp");
    marks.setFlag("installed", true);
    expect(store.data.get("myapp.installed")).toBe("1");
    expect(marks.flag("installed")).toBe(true);
    marks.setFlag("installed", false);
    expect(store.data.has("myapp.installed")).toBe(false);
  });

  it("none remembers nothing; a throwing adapter is harmless; no window is fine", () => {
    const none = createMarks(resolveStorage("none"));
    none.setFlag("installed", true);
    expect(none.flag("installed")).toBe(false);

    const broken = createMarks(
      resolveStorage({
        get: () => {
          throw new Error("x");
        },
        set: () => {
          throw new Error("x");
        },
      }),
    );
    expect(() => broken.setFlag("installed", true)).not.toThrow();
    expect(broken.flag("installed")).toBe(false);

    const ssr = createMarks(resolveStorage("localStorage"));
    expect(() => ssr.setFlag("guideSeen", true)).not.toThrow();
    expect(ssr.flag("guideSeen")).toBe(false);
  });
});
