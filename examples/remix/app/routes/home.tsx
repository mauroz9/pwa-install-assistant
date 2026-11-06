import { InstallAssistant } from "pwa-install-assistant/react";

export function meta() {
  return [{ title: "Acme · Install" }];
}

// Server-rendered as an empty container; the assistant appears on hydration.
export default function Home() {
  return (
    <main>
      <h1>Install Acme</h1>
      <InstallAssistant appName="Acme" icon="/icon-192.png" onEvent={(e) => console.log(e.type)} />
    </main>
  );
}
