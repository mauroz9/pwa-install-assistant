import { defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch, type PropType } from "vue";

import type { InstallEvent } from "../core/controller";
import {
  createInstallAssistant,
  type InstallAssistant as AssistantInstance,
  type InstallAssistantOptions,
} from "../ui/assistant";

export type * from "../core/controller";
export type {
  InstallAssistant as InstallAssistantInstance,
  InstallAssistantOptions,
  Theme,
  Trigger,
} from "../ui/assistant";

type O = InstallAssistantOptions;
const any = <T>() => ({ type: null as unknown as PropType<T>, default: undefined });

/**
 * The install assistant for Vue 3 (and Nuxt: it only touches the DOM once mounted).
 *
 * ```vue
 * <InstallAssistant app-name="Acme" icon="/icon-192.png" @event="(e) => track(e.type)" />
 * ```
 *
 * Every option is a prop; `options` takes any other. `ref.value.open()` opens a modal or sheet.
 */
export const InstallAssistant = defineComponent({
  name: "InstallAssistant",
  props: {
    appName: String,
    appUrl: String,
    openUrl: String,
    icon: String,
    locale: any<O["locale"]>(),
    locales: any<O["locales"]>(),
    messages: any<O["messages"]>(),
    mode: String as PropType<O["mode"]>,
    theme: any<O["theme"]>(),
    arrow: any<O["arrow"]>(),
    steps: any<O["steps"]>(),
    trigger: any<O["trigger"]>(),
    showAgainAfter: Number,
    when: any<O["when"]>(),
    support: any<O["support"]>(),
    storage: any<O["storage"]>(),
    storageKey: String,
    guide: any<O["guide"]>(),
    env: any<O["env"]>(),
    qr: { type: [Boolean, Function] as PropType<O["qr"]>, default: undefined },
    nonce: String,
    injectStyles: { type: Boolean, default: undefined },
    debug: { type: Boolean, default: undefined },
    options: any<O>(),
  },
  emits: { event: (_event: InstallEvent) => true },
  setup(props, { emit, expose }) {
    const host = ref<HTMLDivElement | null>(null);
    const instance = shallowRef<AssistantInstance | null>(null);

    const options = (): O => {
      const own = Object.fromEntries(Object.entries(props).filter(([k, v]) => k !== "options" && v !== undefined));
      return { ...props.options, ...own, onEvent: (event: InstallEvent) => emit("event", event) };
    };
    const create = () => {
      instance.value?.destroy();
      instance.value = createInstallAssistant(host.value, options());
    };

    onMounted(create);
    // The container and detection: start again. Texts and looks: update in place.
    watch(
      () => [props.mode, props.env, props.support, props.storage, props.storageKey, props.debug, props.nonce],
      create,
      { deep: true },
    );
    watch(
      () => [
        props.appName,
        props.appUrl,
        props.openUrl,
        props.icon,
        props.locale,
        props.messages,
        props.theme,
        props.arrow,
        props.steps,
        props.qr,
      ],
      () => instance.value?.update(options()),
      { deep: true },
    );
    onBeforeUnmount(() => {
      instance.value?.destroy();
      instance.value = null;
    });

    expose({
      instance,
      open: () => instance.value?.open(),
      close: () => instance.value?.close(),
    });
    return () => h("div", { ref: host });
  },
});
