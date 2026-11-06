import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from "@angular/core";
import "pwa-install-assistant/element";
import { InstallAssistantComponent } from "./install-assistant.component";

@Component({
  selector: "app-root",
  imports: [InstallAssistantComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>Install Acme</h1>
    <button type="button" (click)="locale.set(locale() === 'en' ? 'es' : 'en')">
      {{ locale() === "en" ? "Español" : "English" }}
    </button>

    <!-- The typed wrapper -->
    <install-assistant appName="Acme" icon="/icon-192.png" [locale]="locale()" (installEvent)="last = $event.type" />
    <p>Last event: {{ last }}</p>

    <!-- Or the custom element -->
    <pwa-install-assistant app-name="Acme" mode="sheet" trigger="gesture"></pwa-install-assistant>
  `,
})
export class App {
  readonly locale = signal("en");
  last = "";
}
