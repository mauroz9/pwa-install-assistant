# Options

Every option of `createInstallAssistant(element, options)`, and of the framework wrappers (same names as props).
All are optional.

## What it installs

| Option | Type | Default | |
|---|---|---|---|
| `appName` | `string` | `document.title` | Name in the texts and the drawings. |
| `appUrl` | `string` | this page | The URL to install. Used by the desktop QR code, «Copy link» and «Open in Safari/Chrome». Point it at the page that shows the assistant. |
| `openUrl` | `string` | `appUrl` | Where «Open {app}» goes once installed (e.g. your `start_url`). |
| `icon` | `string` | initial on a tile | App icon URL, drawn in the illustrations (192 px is plenty). |

## How it looks

| Option | Type | Default | |
|---|---|---|---|
| `mode` | `"inline" \| "modal" \| "sheet"` | `"inline"` | `inline` renders into `element`. `modal` and `sheet` (bottom sheet) use a native `<dialog>` (focus trapped, Escape, inert background, focus restored); `element` is optional and only says where to append it. |
| `theme.accent` | CSS colour | `#1546d1` | Buttons, arrows, highlights. Hover, soft and border shades are derived with `color-mix()`. |
| `theme.success` | CSS colour | `#22c07f` | Done steps and «installed». |
| `theme.radius` | `number \| string` | `14` | Corner radius (number = px). |
| `theme.font` | CSS font family | `inherit` | |
| `theme.scheme` | `"light" \| "dark" \| "auto"` | `"light"` | `auto` follows `prefers-color-scheme`. |
| `theme.vars` | `Record<string, string>` | — | Any `--pia-*` variable (below). |
| `arrow.size` | `number` | `44` | Arrow at Safari's real button, in px. |
| `arrow.color` | CSS colour | accent | |
| `arrow.render` | `(el: HTMLElement) => void` | — | Draw the arrow yourself inside `el` (already positioned). |
| `steps.illustrations` | `"default" \| "minimal" \| (step, ctx) => Node` | `"default"` | Full browser drawings, only the thing to tap, or your own. `ctx` has `app`, `host`, `iconUrl` and the iOS labels. |
| `injectStyles` | `boolean` | `true` | `false`: import `pwa-install-assistant/style.css` yourself. |
| `nonce` | `string` | — | CSP nonce for the one injected `<style>`. |

### CSS variables

Set them on `.pia` (or through `theme.vars`): `--pia-accent`, `--pia-accent-ink`, `--pia-accent-soft`,
`--pia-accent-line`, `--pia-on-accent`, `--pia-success`, `--pia-success-soft`, `--pia-success-ink`, `--pia-fg`,
`--pia-muted`, `--pia-faint`, `--pia-bg`, `--pia-canvas`, `--pia-hush`, `--pia-line`, `--pia-line-strong`,
`--pia-device`, `--pia-radius`, `--pia-font`, `--pia-shadow`, `--pia-arrow-size`, `--pia-arrow-color`, `--pia-z`
(z-index of the arrow and the pinned hint).

## Language

| Option | Type | Default | |
|---|---|---|---|
| `locale` | `string \| Messages` | `"auto"` | A code (`"es"`, `"pt-BR"` → `pt`), a pack, or `auto`: the first of `navigator.languages` that has a pack, else English. |
| `locales` | `Messages[]` | — | Extra packs `auto` and codes can choose from. |
| `messages` | deep partial `Messages` | — | Override any text, e.g. `{ prompt: { button: "Get {app}" } }`. Arrays are replaced. |

English and Spanish are bundled. Portuguese (Brazil), French, German and Italian are separate imports so they cost
nothing unless used:

```ts
import { fr } from "pwa-install-assistant/locales/fr";
createInstallAssistant(el, { locale: fr });                 // always French
createInstallAssistant(el, { locales: [fr, de] });          // auto among en, es, fr, de
```

A pack has the same keys as `en` (the `Messages` type). Texts use `{app}` and similar placeholders; `browser.*` holds
the labels each browser shows in that language, quoted in the steps.

## When it shows (modal and sheet)

| Option | Type | Default | |
|---|---|---|---|
| `trigger` | `"manual" \| "load" \| "gesture" \| { delay: ms }` | `"manual"` | Open by itself on load, after a delay, after the first tap/click/key, or only with `open()`. |
| `showAgainAfter` | `number` (days) | `Infinity` | Once the person closes it, do not open by itself again (or not for N days; `0` = every time). `open()` always works. |
| `when` | `(state) => boolean` | not installed | Extra condition to open by itself, e.g. `(s) => s.device.os !== "desktop"`. |

## Which cases

| Option | Type | Default | |
|---|---|---|---|
| `support` | `{ [guide]: boolean \| { assistant, ios?: [from, to) } }` | verified cases | Turn the assisted flows (Android prompt assistant, iOS arrow) on or off per guide. See [support.md](./support.md). |
| `spots` | `SpotRow[]` | measured table | Replace the arrow positions. |
| `sheetSignal` | `"blur" \| "visibilitychange" \| "visualViewport" \| null` | `null` | A page event that reveals Safari's Share sheet. None is reliable today. |
| `guide` | guide key | detected | Start with this guide, as if picked. |
| `env` | `{ userAgent?, maxTouchPoints?, uaData?, isBrave? }` | `navigator` | Override detection inputs (simulate a device). |
| `device` | `DeviceInfo` | detected | Skip detection. |
| `qr` | `boolean \| (url) => SVGElement` | `true` | Desktop QR code: generated locally and loaded on demand, off (link only), or your own. |
| `debug` | `boolean` | `false` | Event log panel, and every implemented assisted flow on (to test on a device). |

## Memory

| Option | Type | Default | |
|---|---|---|---|
| `storage` | `"localStorage" \| "sessionStorage" \| "none" \| { get, set }` | `"localStorage"` | Where the marks live. Never sent anywhere. |
| `storageKey` | `string` | `"pwa-install"` | Prefix. Keys: `.installed`, `.guide-seen`, `.safari-bar`, `.dismissed-at`. List them in your cookie/storage policy. |

## Events

`onEvent(event)` hears everything; the library itself sends nothing. `assistant.controller.on(type, fn)` listens to one
type.

| `type` | Extra fields | When |
|---|---|---|
| `detected` | `device`, `guide` | On creation. |
| `shown` / `hidden` | | Rendered inline, or the dialog opened / closed. |
| `closed` | | The person closed the dialog (remembered for `showAgainAfter`). |
| `prompt-available` | | `beforeinstallprompt` arrived. |
| `prompt` | | The native dialog was opened. |
| `accepted` / `dismissed` | | The person's answer in it. |
| `installed` | `source`: `appinstalled` · `related-apps` · `manual` | Installed (browser event, `getInstalledRelatedApps`, or «I've added it»). |
| `opened-standalone` | | This window is the installed app. |
| `guide-picked` | `guide` | Picked another device or browser. |
| `step` | `index`, `total` | Moved to a step of the guide. |
| `bar-chosen` | `bar` | Safari toolbar layout answered. |
| `arrow-start` / `arrow-stop` | | The iOS arrow and hint shown / hidden. |
| `sheet` | `open` | Only with a `sheetSignal`. |
| `link-copied` | | «Copy link». |
| `open-in-browser` | `browser` | «Open in Safari/Chrome». |

## Instance

`assistant.open()`, `close()`, `isOpen`, `update(options)` (re-renders), `destroy()`, `element`, and `controller` (the
headless state: `getState()`, `subscribe()`, `prompt()`, `pick()`, `markInstalled()`…).
