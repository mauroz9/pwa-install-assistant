export const SNIPPETS: Record<string, string> = {
  Vanilla: `import { createInstallAssistant } from "pwa-install-assistant";

createInstallAssistant(document.querySelector("#install"), {
  appName: "Acme",
  icon: "/icon-192.png",
  locale: "auto",               // en, es built in; pt, fr, de, it on import
  theme: { accent: "#0f766e" },
  onEvent: (e) => analytics(e.type), // the library sends nothing
});

// Or a bottom sheet that opens after the first tap, once:
const sheet = createInstallAssistant(null, { appName: "Acme", mode: "sheet", trigger: "gesture" });`,
  React: `import { InstallAssistant } from "pwa-install-assistant/react";

export function Install() {
  return <InstallAssistant appName="Acme" icon="/icon-192.png" onEvent={(e) => track(e.type)} />;
}

// Headless: draw your own
import { useInstallState } from "pwa-install-assistant/react";
const install = useInstallState(); // null on the server`,
  "Next.js": `// app/install/page.tsx — the React entry is already a client component
import { headers } from "next/headers";
import { InstallAssistant } from "pwa-install-assistant/react";

export default async function Page() {
  const nonce = (await headers()).get("x-nonce") ?? undefined; // strict CSP
  return <InstallAssistant appName="Acme" nonce={nonce} />;
}`,
  Vue: `<script setup>
import { InstallAssistant } from "pwa-install-assistant/vue";
</script>

<template>
  <InstallAssistant app-name="Acme" icon="/icon-192.png" @event="(e) => track(e.type)" />
</template>`,
  Svelte: `<script>
  import { installAssistant } from "pwa-install-assistant/svelte";
</script>

<div use:installAssistant={{ appName: "Acme", icon: "/icon-192.png" }}></div>`,
  Solid: `import { installAssistant } from "pwa-install-assistant/solid";

<div use:installAssistant={{ appName: "Acme", icon: "/icon-192.png" }} />`,
  Angular: `import { CUSTOM_ELEMENTS_SCHEMA, Component } from "@angular/core";
import "pwa-install-assistant/element";

@Component({
  selector: "app-install",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<pwa-install-assistant app-name="Acme" icon="/icon-192.png"></pwa-install-assistant>\`,
})
export class Install {}
// or copy the typed wrapper from examples/angular`,
  HTML: `<pwa-install-assistant app-name="Acme" icon="/icon-192.png" locale="es"></pwa-install-assistant>

<script type="module">
  import "https://esm.sh/pwa-install-assistant/element";
</script>`,
};
