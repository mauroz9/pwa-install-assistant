/**
 * Tiny DOM builder. Nodes are created one by one (never parsed from HTML), so
 * the UI works under a strict CSP and Trusted Types. There is no `style`
 * attribute: dynamic values go through CSSOM (`setVars`), which CSP allows.
 */

export type Child = Node | string | number | false | null | undefined | Child[];
type Listener = (event: Event) => void;
export type Attrs = Record<string, string | number | boolean | null | undefined | Listener>;

function apply(el: Element, attrs: Attrs | null | undefined) {
  if (!attrs) return;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "style") throw new Error("pwa-install-assistant: no style attributes (CSP); use setVars()");
    if (typeof value === "function") {
      el.addEventListener(key.replace(/^on/, "").toLowerCase(), value);
    } else if (key === "class") {
      el.setAttribute("class", String(value));
    } else {
      el.setAttribute(key, value === true ? "" : String(value));
    }
  }
}

function append(el: Node, children: Child[]) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(el, child);
    else el.appendChild(typeof child === "object" ? child : document.createTextNode(String(child)));
  }
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  apply(el, attrs);
  append(el, children);
  return el;
}

const SVG = "http://www.w3.org/2000/svg";

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...children: Child[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  apply(el, attrs);
  append(el, children);
  return el;
}

/** Sets CSS custom properties (or plain properties) through CSSOM. Allowed by a strict CSP. */
export function setVars(el: HTMLElement | SVGElement, vars: Record<string, string | number | null | undefined>) {
  for (const [name, value] of Object.entries(vars)) {
    if (value === null || value === undefined) el.style.removeProperty(name);
    else el.style.setProperty(name, String(value));
  }
}

export function clear(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

let counter = 0;
/** Unique ids for aria-labelledby & co. */
export function uid(prefix = "pia"): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** `prefers-reduced-motion: reduce`? */
export function reducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}
