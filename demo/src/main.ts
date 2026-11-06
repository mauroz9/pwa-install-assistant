import { createInstallAssistant, VERSION } from "pwa-install-assistant";
import "./style.css";

document.querySelector("#version")!.textContent = VERSION;

const params = new URLSearchParams(location.search);
const options = {
  appName: "Acme Notes",
  icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
  locale: params.get("lang") ?? "auto",
  debug: params.get("debug") === "1",
};

createInstallAssistant(document.querySelector<HTMLElement>("#install"), options);
const sheet = createInstallAssistant(null, { ...options, mode: "sheet" });
document.querySelector("#open-sheet")!.addEventListener("click", () => sheet.open());

// The demo is an installable PWA, so the native install dialog can be tried for real.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
