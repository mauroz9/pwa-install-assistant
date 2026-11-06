import { createInstallAssistant, VERSION } from "pwa-install-assistant";
import { de } from "pwa-install-assistant/locales/de";
import { fr } from "pwa-install-assistant/locales/fr";
import { it } from "pwa-install-assistant/locales/it";
import { pt } from "pwa-install-assistant/locales/pt";
import { DEVICES, type Bar, type SimDevice } from "./devices";
import { SNIPPETS } from "./snippets";
import "./style.css";

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const base = import.meta.env.BASE_URL;
$("#version").textContent = VERSION;

// —— Simulator ——
const params = new URLSearchParams(location.search);
const state = {
  device: DEVICES.find((d) => d.id === params.get("device")) ?? DEVICES[0],
  bar: (params.get("bar") as Bar) ?? "compact",
  lang: params.get("lang") ?? "en",
  accent: "",
};
const ACCENTS = ["", "#0f766e", "#e11d48", "#7c3aed", "#ea580c"];

const select = $<HTMLSelectElement>("#device");
for (const group of ["iPhone", "iPad", "Android", "Other"]) {
  const optgroup = document.createElement("optgroup");
  optgroup.label = group;
  for (const d of DEVICES.filter((x) => x.group === group)) optgroup.append(new Option(d.label, d.id));
  select.append(optgroup);
}
select.value = state.device.id;
select.addEventListener("change", () => {
  state.device = DEVICES.find((d) => d.id === select.value)!;
  load();
});
$<HTMLSelectElement>("#lang").value = state.lang;
$<HTMLSelectElement>("#lang").addEventListener("change", (e) => {
  state.lang = (e.target as HTMLSelectElement).value;
  load();
});
document.querySelectorAll<HTMLButtonElement>("[data-bar]").forEach((b) =>
  b.addEventListener("click", () => {
    state.bar = b.dataset.bar as Bar;
    load();
  }),
);
for (const accent of ACCENTS) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "swatch";
  b.setAttribute("aria-label", accent ? `Accent ${accent}` : "Default accent");
  b.style.setProperty("--c", accent || "#1546d1");
  b.addEventListener("click", () => {
    state.accent = accent;
    load();
  });
  $("#accents").append(b);
}
$("#reset").addEventListener("click", () => load());
$("#offer").addEventListener("click", () =>
  $<HTMLIFrameElement>("#frame").contentWindow?.postMessage(
    { source: "pia-demo", type: "offer-install" },
    location.origin,
  ),
);

const ICON = {
  back: `<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>`,
  fwd: `<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>`,
  share: `<svg viewBox="0 0 24 24"><path d="M8.5 9H6.5a1 1 0 0 0-1 1v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-2M12 14V3M8.5 6.5 12 3l3.5 3.5"/></svg>`,
  more: `<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`,
  kebab: `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>`,
  menu: `<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  book: `<svg viewBox="0 0 24 24"><path d="M3.5 5.5h5A3.5 3.5 0 0 1 12 9v10.5a2.5 2.5 0 0 0-2.5-2.5h-6zM20.5 5.5h-5A3.5 3.5 0 0 0 12 9v10.5a2.5 2.5 0 0 1 2.5-2.5h6z"/></svg>`,
  tabs: `<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>`,
  home: `<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7M6.5 9.5V20h11V9.5"/></svg>`,
  plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  side: `<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/></svg>`,
};
const btn = (icon: keyof typeof ICON, cls = "") => `<span class="b ${cls}">${ICON[icon]}</span>`;
const url = (host = "acme.example", cls = "") => `<span class="url ${cls}">${host}</span>`;

/** Browser bars around the page, and the page's height, for each browser. */
function chrome(d: SimDevice, bar: Bar): { top: string; bottom: string; height: number; status: boolean } {
  switch (d.chrome) {
    case "safari26":
      if (bar === "compact")
        return {
          top: "",
          bottom: `<div class="pill-row">${btn("back", "round")}${url()}${btn("more", "round at-58")}</div>`,
          height: 754,
          status: true,
        };
      if (bar === "bottom")
        return {
          top: "",
          bottom: `<div class="row">${url("acme.example", "wide")}</div><div class="row even">${btn("back")}${btn("fwd")}${btn("share")}${btn("book")}${btn("tabs")}</div>`,
          height: 654,
          status: true,
        };
      return {
        top: `<div class="row">${url("acme.example", "wide")}</div>`,
        bottom: `<div class="row even floating">${btn("back")}${btn("fwd")}${btn("share")}${btn("book")}${btn("tabs")}</div>`,
        height: 690,
        status: true,
      };
    case "safari18":
      return {
        top: `<div class="row small">${url()}</div>`,
        bottom: `<div class="row even">${btn("back")}${btn("fwd")}${btn("share")}${btn("book")}${btn("tabs")}</div>`,
        height: d.height,
        status: true,
      };
    case "ipad":
      return {
        top: `<div class="row ipad">${btn("side")}${btn("back")}${btn("fwd")}${url("acme.example", "wide")}${btn("share", "at-120")}${btn("plus")}${btn("tabs")}</div>`,
        bottom: "",
        height: d.height,
        status: true,
      };
    case "chrome-android":
      return {
        top: `<div class="row android">${btn("home")}${url("acme.example", "wide")}${btn("tabs")}${btn("kebab")}</div>`,
        bottom: `<div class="gesture"></div>`,
        height: d.height,
        status: true,
      };
    case "samsung":
      return {
        top: `<div class="row android">${url("acme.example", "wide")}</div>`,
        bottom: `<div class="row even">${btn("back")}${btn("fwd")}${btn("home")}${btn("book")}${btn("tabs")}${btn("menu")}</div>`,
        height: d.height - 56,
        status: true,
      };
    case "instagram":
      return {
        top: `<div class="row app">${btn("close")}<b>Instagram</b>${btn("more")}</div>`,
        bottom: `<div class="gesture"></div>`,
        height: d.height,
        status: true,
      };
    case "desktop":
      return {
        top: `<div class="row window"><span class="lights"><i></i><i></i><i></i></span>${url("acme.example/install", "wide")}</div>`,
        bottom: "",
        height: d.height,
        status: false,
      };
  }
}

const phone = $("#phone");
const frame = $<HTMLIFrameElement>("#frame");
const stage = $("#stage");

function fit() {
  const w = state.device.width;
  const h = phone.offsetHeight;
  const available = stage.clientWidth;
  const s = Math.min(1, available / (w + 24), (window.innerHeight * 0.86) / (h + 24));
  phone.style.transform = `scale(${s})`;
  stage.style.height = `${(h + 24) * s}px`;
}

function load() {
  const d = state.device;
  const c = chrome(d, state.bar);
  phone.dataset.chrome = d.chrome;
  phone.dataset.bar = state.bar;
  phone.style.width = `${d.width}px`;
  $("#phone-top").innerHTML = c.top;
  $("#phone-bottom").innerHTML = c.bottom;
  phone.querySelector<HTMLElement>(".phone-status")!.hidden = !c.status;
  frame.style.height = `${c.height}px`;
  $("#bar-field").hidden = d.chrome !== "safari26";
  document
    .querySelectorAll<HTMLButtonElement>("[data-bar]")
    .forEach((b) => b.setAttribute("aria-checked", String(b.dataset.bar === state.bar)));
  $("#offer").hidden = !d.prompt;
  $("#log").replaceChildren();
  const q = new URLSearchParams({ device: d.id, lang: state.lang, t: String(Date.now()) });
  if (d.chrome === "safari26") q.set("bar", state.bar);
  if (state.accent) q.set("accent", state.accent);
  frame.src = `${base}device.html?${q}`;
  const shareable = new URLSearchParams({
    device: d.id,
    lang: state.lang,
    ...(d.chrome === "safari26" ? { bar: state.bar } : {}),
  });
  history.replaceState(null, "", `?${shareable}${location.hash}`);
  requestAnimationFrame(fit);
}

addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.data?.source !== "pia-device") return;
  if (e.data.type !== "event") return;
  if (e.data.event === "bar-chosen" && e.data.detail && e.data.detail !== state.bar) {
    // The person answered inside the page: draw that Safari bar around it.
    state.bar = e.data.detail;
    const c = chrome(state.device, state.bar);
    $("#phone-top").innerHTML = c.top;
    $("#phone-bottom").innerHTML = c.bottom;
    frame.style.height = `${c.height}px`;
    phone.dataset.bar = state.bar;
    document
      .querySelectorAll<HTMLButtonElement>("[data-bar]")
      .forEach((b) => b.setAttribute("aria-checked", String(b.dataset.bar === state.bar)));
    requestAnimationFrame(fit);
  }
  const li = document.createElement("li");
  li.textContent = e.data.event + (e.data.detail ? ` (${e.data.detail})` : "");
  $("#log").prepend(li);
});
addEventListener("resize", fit);
load();

// —— The real assistant, for this device ——
const options = {
  appName: "Acme Notes",
  icon: `${base}icons/icon-192.png`,
  locale: params.get("lang") ?? "auto",
  locales: [pt, fr, de, it],
  debug: params.get("debug") === "1",
};
createInstallAssistant($("#install"), options);
const sheet = createInstallAssistant(null, { ...options, mode: "sheet" });
$("#open-sheet").addEventListener("click", () => sheet.open());

// —— Copy, tabs ——
$("#copy").addEventListener("click", async (e) => {
  const button = e.currentTarget as HTMLButtonElement;
  try {
    await navigator.clipboard.writeText("npm i pwa-install-assistant");
    button.textContent = "Copied";
    setTimeout(() => (button.textContent = "Copy"), 1600);
  } catch {
    /* clipboard blocked */
  }
});
const tabs = document.querySelector<HTMLElement>(".tabs")!;
const code = $("#code");
function show(name: string) {
  code.textContent = SNIPPETS[name];
  tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.textContent === name)));
}
for (const name of Object.keys(SNIPPETS)) {
  const b = document.createElement("button");
  b.type = "button";
  b.role = "tab";
  b.textContent = name;
  b.addEventListener("click", () => show(name));
  tabs.append(b);
}
show("Vanilla");

// The demo is an installable app, so the native install dialog can be tried for real.
if ("serviceWorker" in navigator) void navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
