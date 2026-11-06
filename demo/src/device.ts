/**
 * The page inside the simulated device (an iframe as big as the phone's viewport). It mounts the
 * real assistant with the simulated User-Agent, and on Android it plays Chrome's part: a
 * `beforeinstallprompt` on demand and a mock of the native install sheet.
 */
import { createInstallAssistant, type InstallEvent } from "pwa-install-assistant";
import { de } from "pwa-install-assistant/locales/de";
import { fr } from "pwa-install-assistant/locales/fr";
import { it } from "pwa-install-assistant/locales/it";
import { pt } from "pwa-install-assistant/locales/pt";
import { DEVICES } from "./devices";
import "./device.css";

const params = new URLSearchParams(location.search);
const device = DEVICES.find((d) => d.id === params.get("device")) ?? DEVICES[0];
const bar = params.get("bar");
const key = `pia-demo-${device.id}`;
// A fresh simulated device every time it is chosen.
for (const k of Object.keys(sessionStorage)) if (k.startsWith(key)) sessionStorage.removeItem(k);
if (bar) sessionStorage.setItem(`${key}.safari-bar`, bar);

const post = (data: unknown) =>
  parent.postMessage({ source: "pia-device", ...((data as object) ?? {}) }, location.origin);

createInstallAssistant(document.querySelector<HTMLElement>("#install"), {
  appName: "Acme Notes",
  appUrl: new URL("./", location.href).href,
  icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
  locale: params.get("lang") ?? "en",
  locales: [pt, fr, de, it],
  env: { userAgent: device.ua, maxTouchPoints: device.touch, uaData: null, isBrave: false },
  storage: "sessionStorage",
  storageKey: key,
  theme: params.get("accent") ? { accent: params.get("accent")! } : undefined,
  onEvent: (event: InstallEvent) => {
    post({ type: "event", event: event.type, detail: "bar" in event ? event.bar : undefined });
  },
});

// —— Chrome's part, on Android ——
const native = document.querySelector<HTMLElement>("#native")!;

function nativeSheet(): Promise<"accepted" | "dismissed"> {
  return new Promise((resolve) => {
    native.hidden = false;
    native.replaceChildren();
    const sheet = document.createElement("div");
    sheet.className = "native-sheet";
    const title = document.createElement("p");
    title.className = "native-title";
    title.textContent = "Install app";
    const app = document.createElement("div");
    app.className = "native-app";
    const icon = document.createElement("img");
    icon.src = `${import.meta.env.BASE_URL}icons/icon-192.png`;
    icon.alt = "";
    const name = document.createElement("div");
    const b = document.createElement("b");
    b.textContent = "Acme Notes";
    const host = document.createElement("span");
    host.textContent = location.host;
    name.append(b, host);
    app.append(icon, name);
    const row = document.createElement("div");
    row.className = "native-actions";
    const answer = (outcome: "accepted" | "dismissed") => () => {
      native.hidden = true;
      resolve(outcome);
    };
    for (const [label, outcome] of [
      ["Cancel", "dismissed"],
      ["Install", "accepted"],
    ] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", answer(outcome));
      row.append(button);
    }
    const note = document.createElement("p");
    note.className = "native-note";
    note.textContent = "Simulated by the demo: this is the browser's dialog, not the library's.";
    sheet.append(title, app, row, note);
    native.append(sheet);
  });
}

function offerInstall() {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
  let answer!: (choice: { outcome: "accepted" | "dismissed" }) => void;
  event.userChoice = new Promise((r) => (answer = r));
  event.prompt = async () => {
    const outcome = await nativeSheet();
    answer({ outcome });
    if (outcome === "accepted") setTimeout(() => window.dispatchEvent(new Event("appinstalled")), 1400);
    // Chrome offers the dialog again a few seconds after a dismissal.
    else setTimeout(offerInstall, 2500);
  };
  window.dispatchEvent(event);
}

addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.data?.source !== "pia-demo") return;
  if (e.data.type === "offer-install" && device.prompt) offerInstall();
});
post({ type: "ready" });
