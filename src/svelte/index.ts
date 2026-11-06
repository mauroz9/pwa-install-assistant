import { createInstallAssistant, type InstallAssistantOptions } from "../ui/assistant";

export type * from "../core/controller";
export type { InstallAssistant, InstallAssistantOptions, Theme, Trigger } from "../ui/assistant";

/**
 * Svelte action (Svelte 4 and 5, SvelteKit: actions only run in the browser).
 *
 * ```svelte
 * <script>
 *   import { installAssistant } from "pwa-install-assistant/svelte";
 * </script>
 *
 * <div use:installAssistant={{ appName: "Acme", icon: "/icon-192.png" }}></div>
 * ```
 */
export function installAssistant(node: HTMLElement, options: InstallAssistantOptions = {}) {
  let assistant = createInstallAssistant(node, options);
  let last = options;
  return {
    update(next: InstallAssistantOptions = {}) {
      const structural = (["mode", "env", "storage", "storageKey", "support", "debug", "nonce"] as const).some(
        (k) => last[k] !== next[k],
      );
      last = next;
      if (structural) {
        assistant.destroy();
        assistant = createInstallAssistant(node, next);
      } else assistant.update(next);
    },
    destroy() {
      assistant.destroy();
    },
  };
}
