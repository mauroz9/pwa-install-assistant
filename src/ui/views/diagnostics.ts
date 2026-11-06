/**
 * On-screen log of page events (`debug: true`), to check on a real
 * iPhone/iPad whether Safari tells the page anything when the Share sheet or
 * the «Add» dialog opens and closes. Nothing is sent: it lives in the tab's memory.
 */
import type { Part, UiContext } from "../context";
import { h } from "../dom";
import { button } from "../parts";

function snapshot(): string {
  const vv = window.visualViewport;
  const viewport = vv
    ? `vv ${Math.round(vv.width)}×${Math.round(vv.height)} top ${Math.round(vv.offsetTop)} ×${vv.scale.toFixed(2)}`
    : "no vv";
  return `${document.visibilityState}, focus ${document.hasFocus() ? "yes" : "no"}, ${viewport}, inner ${window.innerWidth}×${window.innerHeight}`;
}

export function diagnostics(ctx: UiContext): Part {
  const d = ctx.m.diagnostics;
  const start = performance.now();
  const entries: { t: number; event: string; detail: string }[] = [];
  const list = h("ol", { "aria-live": "off" });
  const copy = button(d.copy, () => void copyLog(), { variant: "secondary", size: "sm" });

  function log(event: string) {
    entries.unshift({ t: Math.round(performance.now() - start), event, detail: snapshot() });
    entries.length = Math.min(entries.length, 200);
    list.replaceChildren(
      ...entries.map((e) => h("li", null, h("b", null, `${(e.t / 1000).toFixed(2)}s ${e.event}`), ` — ${e.detail}`)),
    );
  }
  async function copyLog() {
    const text = entries
      .slice()
      .reverse()
      .map((e) => `${(e.t / 1000).toFixed(2)}s ${e.event} — ${e.detail}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(`${navigator.userAgent}\n${text}`);
      copy.lastChild!.textContent = d.copied;
    } catch {
      /* clipboard blocked */
    }
  }

  const vv = window.visualViewport;
  const targets: [EventTarget, string, string][] = [
    [window, "blur", "blur"],
    [window, "focus", "focus"],
    [window, "pagehide", "pagehide"],
    [window, "pageshow", "pageshow"],
    [window, "resize", "resize"],
    [document, "visibilitychange", "visibilitychange"],
    ...(vv
      ? ([
          [vv, "resize", "visualViewport.resize"],
          [vv, "scroll", "visualViewport.scroll"],
        ] as [EventTarget, string, string][])
      : []),
  ];
  const handlers = targets.map(([target, name, label]) => {
    const handler = () => log(label);
    target.addEventListener(name, handler);
    return () => target.removeEventListener(name, handler);
  });
  const offEvents = ctx.controller.on("*", (event) => log(`assistant:${event.type}`));
  log("start");

  const el = h(
    "section",
    { class: "pia-diag pia-stack-sm" },
    h("h2", { class: "pia-h4" }, d.title),
    h("p", { class: "pia-small" }, d.text),
    h(
      "div",
      { class: "pia-row" },
      copy,
      button(
        d.clear,
        () => {
          entries.length = 0;
          list.replaceChildren();
        },
        { variant: "secondary", size: "sm" },
      ),
    ),
    list,
  );
  return {
    el,
    destroy() {
      handlers.forEach((off) => off());
      offEvents();
    },
  };
}
