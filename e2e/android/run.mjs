#!/usr/bin/env node
/**
 * Real install on the Android emulator, with real taps on Chrome's own UI.
 *
 *   1. Boots the AVD (if needed), `adb reverse` the demo server, opens the demo in Chrome.
 *   2. Reads the page through the Chrome DevTools Protocol (adb forward) — nothing is injected.
 *   3. Taps like a person (`adb shell input tap`), finding Chrome's and the page's buttons with uiautomator.
 *   4. Waits for `beforeinstallprompt` (it needs interaction and time on a first visit), installs: cancel once,
 *      retry, accept, the launcher's confirmation if any, then opens the icon and checks the app mode.
 *
 * usage: AVD=t78pixel BASE_URL=http://localhost:4173 node e2e/android/run.mjs
 * Needs the demo served on the Mac (npx vite preview demo --port 4173) and Node 22+ (WebSocket).
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SDK = process.env.ANDROID_SDK_ROOT ?? join(homedir(), "Library/Android/sdk");
const ADB = join(SDK, "platform-tools/adb");
const EMULATOR = join(SDK, "emulator/emulator");
const AVD = process.env.AVD ?? "t78pixel";
const BASE = process.env.BASE_URL ?? "http://localhost:4173";
const PORT = new URL(BASE).port || "80";
const APP = process.env.APP_NAME ?? "Acme Notes";
const OUT = new URL("./out/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const adb = (...args) => execFileSync(ADB, args, { encoding: "utf8", maxBuffer: 64 << 20 }).trim();
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  log(ok ? "✔" : "✘", name, detail);
};

async function boot() {
  if (
    adb("devices")
      .split("\n")
      .some((l) => /emulator-\d+\s+device/.test(l))
  )
    return log("emulator already running");
  log("booting", AVD);
  spawn(EMULATOR, ["-avd", AVD, "-no-snapshot-save", "-no-boot-anim", "-no-audio"], {
    detached: true,
    stdio: "ignore",
  }).unref();
  adb("wait-for-device");
  while (adb("shell", "getprop", "sys.boot_completed") !== "1") await sleep(2000);
  await sleep(5000);
  log("booted");
}

function shot(name) {
  const png = execFileSync(ADB, ["exec-out", "screencap", "-p"], { maxBuffer: 64 << 20 });
  writeFileSync(join(OUT, `${name}.png`), png);
}

/** Visible nodes of the whole screen (Chrome's UI and the page), from uiautomator. */
function nodes() {
  adb("shell", "uiautomator", "dump", "/sdcard/ui.xml");
  const xml = adb("shell", "cat", "/sdcard/ui.xml");
  return [...xml.matchAll(/<node [^>]*>/g)].map(([n]) => {
    const attr = (k) => n.match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? "";
    const [x1, y1, x2, y2] = attr("bounds").match(/\d+/g)?.map(Number) ?? [0, 0, 0, 0];
    return {
      text: attr("text"),
      desc: attr("content-desc"),
      id: attr("resource-id"),
      cx: (x1 + x2) >> 1,
      cy: (y1 + y2) >> 1,
      w: x2 - x1,
    };
  });
}

function find(labels, { exact = true } = {}) {
  const all = nodes();
  for (const label of labels) {
    const hit = all.find((n) => [n.text, n.desc].some((v) => (exact ? v === label : v.includes(label))) && n.w > 0);
    if (hit) return hit;
  }
  return null;
}

async function tapOn(labels, timeout = 15000, opts) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const n = find(labels, opts);
    if (n) {
      adb("shell", "input", "tap", String(n.cx), String(n.cy));
      return n;
    }
    await sleep(1000);
  }
  return null;
}

// —— Chrome DevTools Protocol over adb ——
async function cdp() {
  adb("forward", "tcp:9333", "localabstract:chrome_devtools_remote");
  for (let i = 0; i < 30; i++) {
    try {
      const pages = await (await fetch("http://127.0.0.1:9333/json")).json();
      const page = pages.find((p) => p.type === "page" && p.url.startsWith(BASE));
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
        let id = 0;
        const pending = new Map();
        ws.onmessage = (m) => {
          const msg = JSON.parse(m.data);
          pending.get(msg.id)?.(msg);
          pending.delete(msg.id);
        };
        const send = (method, params = {}) =>
          new Promise((r) => {
            pending.set(++id, r);
            ws.send(JSON.stringify({ id, method, params }));
          });
        const evaluate = async (expression) =>
          (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;
        return { send, evaluate, close: () => ws.close() };
      }
    } catch {
      /* not ready */
    }
    await sleep(1000);
  }
  throw new Error("no Chrome page to debug");
}

const STATE = `(() => {
  const s = document.querySelector("#install [data-phase]");
  return {
    phase: s?.dataset.phase ?? null,
    status: s?.querySelector("[role=status]")?.textContent ?? null,
    plain: !!document.querySelector("#install [data-prompt=button]"),
    h3: document.querySelector("#install h3")?.textContent ?? null,
    standalone: matchMedia("(display-mode: standalone)").matches,
    text: document.querySelector("#install")?.innerText.slice(0, 160),
    ua: navigator.userAgent,
  };
})()`;

async function waitFor(page, predicate, timeout, poke = false) {
  const end = Date.now() + timeout;
  let state;
  while (Date.now() < end) {
    state = await page.evaluate(STATE);
    if (predicate(state)) return state;
    // A first visit only gets beforeinstallprompt after some engagement: scroll and tap a quiet spot.
    if (poke) {
      adb("shell", "input", "swipe", "540", "1500", "540", "1200", "300");
      await sleep(800);
      adb("shell", "input", "swipe", "540", "1200", "540", "1500", "300");
    }
    await sleep(3000);
  }
  return state;
}

async function main() {
  await boot();
  adb("reverse", `tcp:${PORT}`, `tcp:${PORT}`);
  const chrome = adb("shell", "dumpsys", "package", "com.android.chrome").match(/versionName=(\S+)/)?.[1];
  const android = adb("shell", "getprop", "ro.build.version.release");
  log(`Android ${android}, Chrome ${chrome}`);

  adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", `${BASE}/?lang=en`, "-p", "com.android.chrome");
  await sleep(6000);
  let page = await cdp();
  // Start clean: no marks from a previous run.
  await page.send("Storage.clearDataForOrigin", { origin: new URL(BASE).origin, storageTypes: "local_storage" });
  await page.send("Page.reload");
  await sleep(4000);
  page.close();
  page = await cdp();
  shot("01-page");
  const first = await page.evaluate(STATE);
  check("menu guide before the event", first.h3 === "Tap the ⋮ menu", first.h3 ?? "");
  const installability = await page.send("Page.getInstallabilityErrors");
  check(
    "installable (no installability errors)",
    (installability.result?.installabilityErrors ?? []).length === 0,
    JSON.stringify(installability.result),
  );

  log("waiting for beforeinstallprompt (interaction + time on a first visit)…");
  const arrived = await waitFor(page, (s) => s.phase === "ready" || s.plain, 240000, true);
  check(
    "assistant appears when beforeinstallprompt arrives",
    arrived.phase === "ready",
    `after ${((Date.now() - t0) / 1000).toFixed(0)} s`,
  );
  if (arrived.phase !== "ready") return;
  await page.evaluate(`document.querySelector("#install [data-phase]").scrollIntoView({ block: "center" })`);
  await sleep(1000);
  shot("02-assistant");

  // Cancel once.
  await tapOn([`Install ${APP}`]);
  await sleep(2500);
  shot("03-native-dialog");
  const prompting = await page.evaluate(STATE);
  check("our button opens the native dialog", prompting.phase === "prompting", prompting.status ?? "");
  const cancel = await tapOn(["Cancel"], 5000);
  if (!cancel) adb("shell", "input", "keyevent", "KEYCODE_BACK");
  const dismissed = await waitFor(page, (s) => s.phase === "dismissed", 15000);
  check("cancel → back to step 1", dismissed.phase === "dismissed", dismissed.status ?? "");
  const again = await waitFor(page, (s) => s.status?.includes("try again"), 60000);
  check(
    "Chrome offers the dialog again → «Try again»",
    Boolean(again.status?.includes("try again")),
    again.status ?? "",
  );

  // Retry and install.
  await tapOn(["Try again"]);
  await sleep(2500);
  shot("04-native-dialog-again");
  await tapOn(["Install"], 8000);
  const after = await waitFor(page, (s) => s.phase === "accepted" || s.phase === "installed", 30000);
  check("accept → installing", ["accepted", "installed"].includes(after.phase ?? ""), after.status ?? "");
  // Without a WebAPK (localhost) the launcher asks to confirm after appinstalled.
  await sleep(3000);
  shot("05-after-accept");
  const launcher = await tapOn(["Add", "Add automatically", "ADD", "Add to home screen"], 8000);
  log("launcher confirmation:", launcher ? `tapped «${launcher.text || launcher.desc}»` : "none");
  const installed = await waitFor(page, (s) => s.phase === "installed", 30000);
  check("appinstalled → «installed», by itself", installed.phase === "installed", installed.status ?? "");
  shot("06-installed");
  page.close();

  // Open the icon from the home screen.
  adb("shell", "input", "keyevent", "KEYCODE_HOME");
  await sleep(2000);
  shot("07-home");
  let icon = await tapOn([APP], 5000);
  if (!icon) {
    adb("shell", "input", "swipe", "540", "1800", "540", "600", "300"); // app drawer
    await sleep(1500);
    icon = await tapOn([APP], 5000);
  }
  check("icon on the launcher", Boolean(icon));
  if (icon) {
    await sleep(6000);
    shot("08-app");
    const activity =
      adb("shell", "dumpsys", "activity", "activities").match(/topResumedActivity=.*?\s(\S+\/\S+)/)?.[1] ?? "";
    page = await cdp();
    const app = await page.evaluate(STATE);
    check("opens as an app (display-mode: standalone)", app.standalone === true, activity);
    check(
      "the page says it is installed",
      Boolean(app.text?.includes("It's already installed!")),
      app.text?.split("\n")[0] ?? "",
    );
    page.close();
  }
}

main()
  .catch((error) => check("run", false, String(error)))
  .finally(() => {
    writeFileSync(join(OUT, "results.json"), JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
    const failed = results.filter((r) => !r.ok).length;
    log(failed ? `${failed} check(s) failed` : "all checks passed", `→ ${OUT}`);
    process.exit(failed ? 1 : 0);
  });
