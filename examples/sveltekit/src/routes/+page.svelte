<script>
  import { installAssistant } from "pwa-install-assistant/svelte";

  let locale = $state("en");
</script>

<h1>Install Acme</h1>
<label>
  Language
  <select bind:value={locale}>
    <option value="en">English</option>
    <option value="es">Español</option>
  </select>
</label>

<!-- Actions only run in the browser: safe with SSR and prerendering. -->
<div use:installAssistant={{ appName: "Acme", icon: "/icon-192.png", locale }}></div>
