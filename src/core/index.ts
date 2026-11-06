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
export {
  assistantKind,
  DEFAULT_SUPPORT,
  isAssistantEnabled,
  type AssistantKind,
  type SupportEntry,
  type SupportTable,
} from "./support";
export {
  ARROW_SPOTS,
  arrowPosition,
  arrowSpot,
  DEFAULT_SHEET_SIGNAL,
  iosCase,
  needsBarQuestion,
  SAFARI_BARS,
  type ArrowSpot,
  type IosDevice,
  type IosGen,
  type Orientation,
  type SafariBar,
  type SheetSignal,
  type SpotQuery,
  type SpotRow,
} from "./spots";
export { needsLauncherHint, nextPhase, promptStep, type PromptEvent, type PromptPhase } from "./machine";
export {
  createMarks,
  MARKS,
  resolveStorage,
  type Mark,
  type Marks,
  type StorageAdapter,
  type StorageOption,
} from "./storage";
export {
  createInstallController,
  type ControllerOptions,
  type InstallController,
  type InstallEvent,
  type InstallEventType,
  type InstallState,
  type InstallView,
  type IosArrowState,
  type PromptMode,
} from "./controller";
