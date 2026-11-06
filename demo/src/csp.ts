import { createInstallAssistant } from "pwa-install-assistant";

const violations: string[] = [];
document.addEventListener("securitypolicyviolation", (e) =>
  violations.push(`${e.violatedDirective}: ${e.sample ?? e.blockedURI}`),
);
(window as unknown as { __violations: string[] }).__violations = violations;

const withNonce = new URLSearchParams(location.search).get("nonce") !== "0";
createInstallAssistant(document.querySelector<HTMLElement>("#install"), {
  appName: "Acme",
  locale: "en",
  nonce: withNonce ? "pia-demo-nonce" : undefined,
  theme: { accent: "rgb(225, 29, 72)" },
});
