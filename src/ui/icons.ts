/** Stroke icons on a 24×24 grid, drawn for this library. Decorative: always `aria-hidden`. */
import { svg } from "./dom";

type Shape =
  ["path", string] | ["circle", number, number, number, boolean?] | ["rect", number, number, number, number, number];

const ICONS = {
  share: [
    ["path", "M8.5 9H6.5a1 1 0 0 0-1 1v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-2"],
    ["path", "M12 14V3"],
    ["path", "M8.5 6.5 12 3l3.5 3.5"],
  ],
  more: [
    ["circle", 5, 12, 1.6, true],
    ["circle", 12, 12, 1.6, true],
    ["circle", 19, 12, 1.6, true],
  ],
  kebab: [
    ["circle", 12, 5, 1.6, true],
    ["circle", 12, 12, 1.6, true],
    ["circle", 12, 19, 1.6, true],
  ],
  menu: [["path", "M4 7h16M4 12h16M4 17h16"]],
  back: [["path", "M15 5l-7 7 7 7"]],
  forward: [["path", "M9 5l7 7-7 7"]],
  tabs: [["rect", 5, 5, 14, 14, 3]],
  book: [
    ["path", "M3.5 5.5h5A3.5 3.5 0 0 1 12 9v10.5a2.5 2.5 0 0 0-2.5-2.5h-6z"],
    ["path", "M20.5 5.5h-5A3.5 3.5 0 0 0 12 9v10.5a2.5 2.5 0 0 1 2.5-2.5h6z"],
  ],
  plus: [["path", "M12 5v14M5 12h14"]],
  home: [
    ["path", "M4 11l8-7 8 7"],
    ["path", "M6.5 9.5V20h11V9.5"],
  ],
  sidebar: [
    ["rect", 3.5, 4.5, 17, 15, 2.5],
    ["path", "M9.5 4.5v15"],
  ],
  lock: [
    ["rect", 6, 11, 12, 9, 2],
    ["path", "M9 11V8a3 3 0 0 1 6 0v3"],
  ],
  arrowUp: [
    ["path", "M12 20V5"],
    ["path", "M5.5 11.5 12 5l6.5 6.5"],
  ],
  arrowDown: [
    ["path", "M12 4v15"],
    ["path", "M5.5 12.5 12 19l6.5-6.5"],
  ],
  arrowLeft: [
    ["path", "M20 12H5"],
    ["path", "M11.5 5.5 5 12l6.5 6.5"],
  ],
  check: [["path", "M5 12.5l4.5 4.5L19 7.5"]],
  copy: [
    ["rect", 8.5, 8.5, 12, 12, 2],
    ["path", "M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"],
  ],
  external: [
    ["path", "M14 4h6v6"],
    ["path", "M20 4l-9 9"],
    ["path", "M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"],
  ],
  download: [
    ["path", "M12 4v11"],
    ["path", "M7 10.5l5 5 5-5"],
    ["path", "M5 20h14"],
  ],
  close: [["path", "M6 6l12 12M18 6 6 18"]],
  help: [
    ["circle", 12, 12, 9],
    ["path", "M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.4"],
    ["circle", 12, 17, 0.9, true],
  ],
  play: [["path", "M8 5.5v13l10.5-6.5z"]],
  pause: [["path", "M8.5 5.5v13M15.5 5.5v13"]],
  phone: [
    ["rect", 7, 2.5, 10, 19, 2.5],
    ["path", "M11 18.5h2"],
  ],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName, className = "pia-icon"): SVGSVGElement {
  const shapes = ICONS[name] as Shape[];
  return svg(
    "svg",
    {
      class: className,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2.2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false",
    },
    shapes.map((shape) => {
      if (shape[0] === "path") return svg("path", { d: shape[1] });
      if (shape[0] === "rect")
        return svg("rect", { x: shape[1], y: shape[2], width: shape[3], height: shape[4], rx: shape[5] });
      return svg("circle", {
        cx: shape[1],
        cy: shape[2],
        r: shape[3],
        fill: shape[4] ? "currentColor" : "none",
        stroke: shape[4] ? "none" : "currentColor",
      });
    }),
  );
}
