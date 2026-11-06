/**
 * Copy this file into your Angular app for a typed, standalone wrapper
 * (SSR-safe: it only touches the DOM after the first render in the browser).
 * The <pwa-install-assistant> custom element also works directly with
 * CUSTOM_ELEMENTS_SCHEMA — see app.ts.
 */
import { Component, ElementRef, afterNextRender, effect, input, output, type OnDestroy } from "@angular/core";
import {
  createInstallAssistant,
  type InstallAssistant,
  type InstallAssistantOptions,
  type InstallEvent,
} from "pwa-install-assistant";

@Component({
  selector: "install-assistant",
  template: "",
  host: { class: "install-assistant-host" },
})
export class InstallAssistantComponent implements OnDestroy {
  readonly appName = input<string>();
  readonly icon = input<string>();
  readonly locale = input<string>("auto");
  readonly mode = input<InstallAssistantOptions["mode"]>("inline");
  /** Any other option. */
  readonly options = input<InstallAssistantOptions>({});
  readonly installEvent = output<InstallEvent>();

  private assistant: InstallAssistant | null = null;

  constructor(host: ElementRef<HTMLElement>) {
    afterNextRender(() => {
      this.assistant = createInstallAssistant(host.nativeElement, this.read());
    });
    effect(() => {
      const next = this.read();
      this.assistant?.update(next);
    });
  }

  open() {
    this.assistant?.open();
  }

  private read(): InstallAssistantOptions {
    return {
      ...this.options(),
      appName: this.appName(),
      icon: this.icon(),
      locale: this.locale(),
      mode: this.mode(),
      onEvent: (event) => this.installEvent.emit(event),
    };
  }

  ngOnDestroy() {
    this.assistant?.destroy();
  }
}
