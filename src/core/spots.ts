/**
 * Where Safari's real button is, so the arrow can point at it.
 *
 * The page cannot see taps on Safari's toolbar and tapping the page closes the
 * Share sheet, so the arrow is a fixed element on the page edge that touches
 * the toolbar, pointing out at the button.
 */

export type IosDevice = "iphone" | "ipad";
/** `legacy` = iOS/iPadOS 18 or older; `26` = the Safari 26 redesign ("•••"). */
export type IosGen = "legacy" | "26";
export type Orientation = "portrait" | "landscape";
/**
 * Safari 26 toolbar layout on iPhone (Settings › Apps › Safari › Tabs), which a
 * page cannot read: `compact` = "Compact" (default: back, address and "•••" at
 * the bottom), `bottom` = "Bottom" and `top` = "Top". With "Bottom" and "Top"
 * there is a button row at the bottom with Share in the middle; with "Compact",
 * Share is inside "•••".
 */
export type SafariBar = "compact" | "bottom" | "top";
export const SAFARI_BARS: readonly SafariBar[] = ["compact", "bottom", "top"];

/**
 * Where the arrow goes: on the page edge next to Safari's toolbar, pointing out.
 * `x`: `{ pct }` from the left, or `{ fromRight }` in CSS px to the centre of the button.
 */
export interface ArrowSpot {
  edge: "top" | "bottom";
  x: { pct: number } | { fromRight: number };
  button: "share" | "more";
}

export interface SpotRow {
  device: IosDevice;
  gen: IosGen;
  orientation: Orientation;
  /** `null` = the same for every toolbar layout. */
  bar: SafariBar | null;
  /** `null` = no arrow (text only). */
  spot: ArrowSpot | null;
  /** Measured on a simulator or device (see docs/support.md). */
  verified: boolean;
}

const SHARE_BOTTOM_CENTER: ArrowSpot = { edge: "bottom", x: { pct: 50 }, button: "share" };
/** iPad (iPadOS 26.3, 820 pt and 1180 pt wide): Share 120 pt from the right edge, before "+" and tabs. */
const IPAD_SHARE_TOP: ArrowSpot = { edge: "top", x: { fromRight: 120 }, button: "share" };

/**
 * Position table. The iOS 26 rows were **measured on the iOS 26.3 simulator**
 * (iPhone 17 and iPad A16) with XCUITest: the centre of the real button relative
 * to the window. The iOS 18 and older rows are not verified (their guides keep
 * the assistant off).
 */
export const ARROW_SPOTS: readonly SpotRow[] = [
  // iOS 15–18 (not verified): with the address at the top or bottom, the toolbar stays at the bottom, Share in the middle.
  {
    device: "iphone",
    gen: "legacy",
    orientation: "portrait",
    bar: null,
    spot: SHARE_BOTTOM_CENTER,
    verified: false,
  },
  // In landscape everything moves to the top and the position depends on the model: text only.
  { device: "iphone", gen: "legacy", orientation: "landscape", bar: null, spot: null, verified: false },
  // iOS 26 "Compact" (default): "•••" bottom right, centre 58 pt from the right edge.
  {
    device: "iphone",
    gen: "26",
    orientation: "portrait",
    bar: "compact",
    spot: { edge: "bottom", x: { fromRight: 58 }, button: "more" },
    verified: true,
  },
  // iOS 26 "Bottom" and "Top": Share in the middle of the bottom button row (also with the address at the top).
  { device: "iphone", gen: "26", orientation: "portrait", bar: "bottom", spot: SHARE_BOTTOM_CENTER, verified: true },
  { device: "iphone", gen: "26", orientation: "portrait", bar: "top", spot: SHARE_BOTTOM_CENTER, verified: true },
  // In landscape Share moves to the top bar and its position depends on the model (182 pt on an iPhone 17): text only.
  { device: "iphone", gen: "26", orientation: "landscape", bar: null, spot: null, verified: true },
  // iPad: toolbar at the top, Share right of the address. Measured on iPadOS 26; 18 assumed equal (not verified).
  { device: "ipad", gen: "legacy", orientation: "portrait", bar: null, spot: IPAD_SHARE_TOP, verified: false },
  { device: "ipad", gen: "legacy", orientation: "landscape", bar: null, spot: IPAD_SHARE_TOP, verified: false },
  { device: "ipad", gen: "26", orientation: "portrait", bar: null, spot: IPAD_SHARE_TOP, verified: true },
  { device: "ipad", gen: "26", orientation: "landscape", bar: null, spot: IPAD_SHARE_TOP, verified: true },
];

export interface SpotQuery {
  device: IosDevice;
  gen: IosGen;
  orientation: Orientation;
  bar: SafariBar | null;
}

function findRow(q: SpotQuery, rows: readonly SpotRow[]): SpotRow | undefined {
  return rows.find(
    (row) =>
      row.device === q.device &&
      row.gen === q.gen &&
      row.orientation === q.orientation &&
      (row.bar === null || row.bar === q.bar),
  );
}

/** Where the arrow goes. `null` = no arrow (text only), or the toolbar layout must be asked first. */
export function arrowSpot(q: SpotQuery, rows: readonly SpotRow[] = ARROW_SPOTS): ArrowSpot | null {
  return findRow(q, rows)?.spot ?? null;
}

/** Must we ask which toolbar layout Safari uses? Only when the position depends on the answer. */
export function needsBarQuestion(q: Omit<SpotQuery, "bar">, rows: readonly SpotRow[] = ARROW_SPOTS): boolean {
  return rows.some(
    (r) => r.device === q.device && r.gen === q.gen && r.orientation === q.orientation && r.bar !== null,
  );
}

/**
 * `position: fixed` offsets of an arrow `size` px wide for a spot, as CSS
 * values. Applied through CSSOM (`el.style.setProperty`), which a strict CSP allows.
 */
export function arrowPosition(
  spot: ArrowSpot,
  size = 44,
): Partial<Record<"left" | "right" | "top" | "bottom", string>> {
  const half = size / 2;
  const position: Partial<Record<"left" | "right" | "top" | "bottom", string>> = {};
  if ("pct" in spot.x) position.left = `calc(${spot.x.pct}% - ${half}px)`;
  else position.right = `${Math.max(0, spot.x.fromRight - half)}px`;
  if (spot.edge === "bottom") position.bottom = "calc(env(safe-area-inset-bottom, 0px) + 4px)";
  else position.top = "calc(env(safe-area-inset-top, 0px) + 4px)";
  return position;
}

/** Device and generation from the guide (`iphone-safari-26` → iphone, 26). */
export function iosCase(key: string | null): { device: IosDevice; gen: IosGen } | null {
  const match = key?.match(/^(iphone|ipad)-safari(-26)?$/);
  if (!match) return null;
  return { device: match[1] as IosDevice, gen: match[2] ? "26" : "legacy" };
}

/**
 * A page event that would reveal that Safari's Share sheet opened, if one were
 * reliable. `null` = none is: the pinned hint shows every step at once and does
 * not move on.
 *
 * Verified on the iOS 26.3 simulator (iPhone and iPad): opening and closing the
 * "•••" menu or the Share sheet fires **nothing** on the page (no `blur`,
 * `visibilitychange`, `pagehide` or `visualViewport`). Only the "Add to Home
 * Screen" dialog fires `blur` (and `visualViewport.resize`, for the keyboard),
 * but cancelling it does not bring `focus` back, and that dialog covers the page.
 */
export type SheetSignal = "blur" | "visibilitychange" | "visualViewport";
export const DEFAULT_SHEET_SIGNAL: SheetSignal | null = null;
