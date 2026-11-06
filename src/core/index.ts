/**
 * pwa-install-assistant/headless: detection, support table and state, without
 * any UI. Importable on a server: nothing touches `window` until it is called.
 */
export const VERSION: string = __VERSION__;

export {
  chooseGuide,
  detectDevice,
  GUIDE_KEYS,
  IOS_26,
  IOS_OTHER_BROWSERS_MIN,
  isGuideKey,
  readEnv,
  supportsInstallPrompt,
  type Browser,
  type DetectEnv,
  type DeviceInfo,
  type GuideKey,
  type InApp,
  type Os,
} from "./detect";
export {
  detectStandalone,
  hasInstalledRelatedApp,
  isStandalone,
  STANDALONE_DISPLAY_MODES,
  type StandaloneEnv,
} from "./standalone";
export {
  canPrompt,
  captureInstallPrompt,
  onPromptChange,
  promptInstall,
  wasInstalledThisVisit,
  whenInstalled,
  type BeforeInstallPromptEvent,
  type PromptOutcome,
} from "./prompt";
