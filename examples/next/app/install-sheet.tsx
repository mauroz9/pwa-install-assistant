"use client";

import { useRef } from "react";
import { InstallAssistant, type InstallAssistantInstance } from "pwa-install-assistant/react";

/** Functions (onEvent) cannot cross the server/client boundary: wrap them in a client component. */
export function InstallSheet({ nonce }: { nonce?: string }) {
  const ref = useRef<InstallAssistantInstance | null>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.open()}>
        Install the app
      </button>
      <InstallAssistant ref={ref} mode="sheet" appName="Acme" nonce={nonce} onEvent={(e) => console.log(e.type)} />
    </>
  );
}
