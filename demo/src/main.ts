import { createInstallAssistant, VERSION } from "pwa-install-assistant";
import "./style.css";

document.querySelector("#version")!.textContent = VERSION;

const params = new URLSearchParams(location.search);
const options = {
  appName: "Acme Notes",
  locale: params.get("lang") ?? "auto",
  debug: params.get("debug") === "1",
};

createInstallAssistant(document.querySelector<HTMLElement>("#install"), options);
const sheet = createInstallAssistant(null, { ...options, mode: "sheet" });
document.querySelector("#open-sheet")!.addEventListener("click", () => sheet.open());
