import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { createInstallState, installAssistant } from "pwa-install-assistant/solid";

// Keeps the directive import (TypeScript would drop it otherwise).
void installAssistant;

function App() {
  const [locale, setLocale] = createSignal("en");
  const install = createInstallState();
  return (
    <main>
      <h1>Install Acme</h1>
      <p>Detected view: {install.state().view}</p>
      <button type="button" onClick={() => setLocale(locale() === "en" ? "es" : "en")}>
        {locale() === "en" ? "Español" : "English"}
      </button>
      <div use:installAssistant={{ appName: "Acme", icon: "/icon-192.png", locale: locale() }} />
    </main>
  );
}

render(() => <App />, document.getElementById("root")!);
