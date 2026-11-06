/**
 * pwa-install-assistant/qr: a local QR code generator with no dependencies.
 * The assistant loads it lazily on desktop; you can also use it on its own.
 */
import { qrPath, type Ecc } from "./encode";

export { encodeQr, qrPath, type Ecc } from "./encode";

/** An `<svg>` QR code (`role="img"` with `label`), crisp at any size. */
export function qrSvg(
  text: string,
  options: { label?: string; ecc?: Ecc; dark?: string; light?: string } = {},
): SVGSVGElement {
  const NS = "http://www.w3.org/2000/svg";
  const { size, d } = qrPath(text, options.ecc);
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("shape-rendering", "crispEdges");
  if (options.label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.label);
  } else svg.setAttribute("aria-hidden", "true");
  const bg = document.createElementNS(NS, "rect");
  bg.setAttribute("width", String(size));
  bg.setAttribute("height", String(size));
  bg.setAttribute("fill", options.light ?? "#ffffff");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", options.dark ?? "#172030");
  svg.append(bg, path);
  return svg;
}
