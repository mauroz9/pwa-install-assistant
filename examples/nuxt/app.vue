<script setup lang="ts">
import { ref } from "vue";
import { InstallAssistant } from "pwa-install-assistant/vue";

// The component only touches the DOM once mounted: no <ClientOnly> needed.
const sheet = ref<{ open: () => void } | null>(null);
</script>

<template>
  <main>
    <h1>Install Acme</h1>
    <InstallAssistant
      app-name="Acme"
      icon="/icon-192.png"
      :theme="{ accent: '#0f766e' }"
      @event="(e) => console.log(e.type)"
    />
    <button type="button" @click="sheet?.open()">Install the app</button>
    <InstallAssistant ref="sheet" app-name="Acme" mode="sheet" />
  </main>
</template>
