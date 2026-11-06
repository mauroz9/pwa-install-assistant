import { headers } from "next/headers";
import { InstallAssistant } from "pwa-install-assistant/react";
import { InstallSheet } from "./install-sheet";

// The React entry is already a client component: render it straight from a server component.
export default async function InstallPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <main>
      <h1>Install Acme</h1>
      <InstallAssistant appName="Acme" icon="/icon-192.png" nonce={nonce} theme={{ accent: "#0f766e" }} />
      <InstallSheet nonce={nonce} />
    </main>
  );
}
