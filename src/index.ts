export * from "./core/index";
export {
  createInstallAssistant,
  type AssistantMode,
  type InstallAssistant,
  type InstallAssistantOptions,
} from "./ui/assistant";
export { buildGuide, hasSteps, PICKER_GROUPS, STEP_GUIDES, type Guide, type Scene, type Step } from "./ui/guides";
export { fill, mergeMessages, resolveLocale, type DeepPartial, type Messages } from "./ui/i18n";
export type { Illustrations, SceneContext } from "./ui/scene";
export { CSS as PWA_INSTALL_CSS, injectStyles } from "./ui/styles";
export { promptStatus } from "./ui/views/prompt";
export { en } from "./locales/en";
export { es } from "./locales/es";
