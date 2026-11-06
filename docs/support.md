# Support table

What each case gets, and why. A case gets an **assisted flow** (Android prompt assistant or iOS arrow) only when it has
been verified on a simulator, an emulator or a real device; everything else gets the illustrated guide. The table in
code is `DEFAULT_SUPPORT` (`src/core/support.ts`) and the arrow positions are `ARROW_SPOTS` (`src/core/spots.ts`).

## Assisted flows

| Guide | Flow | Default | Verified on | Date |
|---|---|---|---|---|
| `android-chrome` | prompt assistant | **on** | Android emulator, Pixel 7, Android 15, Chrome 124 (reference) | 2026-11-05 |
| `android-edge`, `android-samsung`, `android-opera`, `android-brave` | prompt assistant | off | — (their plain install button still shows when the browser fires `beforeinstallprompt`) | |
| `iphone-safari-26` | iOS arrow, iOS ≥ 26 and < 27 | **on** | iOS 26.3 simulator, iPhone 17, XCUITest, toolbars Compact, Bottom and Top (reference) | 2026-11-05 |
| `ipad-safari-26` | iOS arrow, iPadOS ≥ 26 and < 27 | **on** | iOS 26.3 simulator, iPad A16, XCUITest, portrait and landscape (reference) | 2026-11-05 |
| `iphone-safari`, `ipad-safari` (18 and older) | iOS arrow | off | — no simulator runtime | |
| Safari 27 | iOS arrow | off | — not released | |
| Every other guide | illustrated guide | — | | |

## Arrow positions (iOS 26.3 simulator)

| Device | Safari toolbar | Real button | Measured centre | Arrow |
|---|---|---|---|---|
| iPhone 17 (402×874 pt), portrait | Compact (default) | «•••», then Share | 58 pt from the right edge, bottom | bottom, `fromRight: 58` |
| iPhone 17, portrait | Bottom | Share, button row under the address | centre (x 200), bottom | bottom, 50 % |
| iPhone 17, portrait | Top | Share, bottom button row | centre (x 200), bottom | bottom, 50 % |
| iPhone 17, landscape | any | Share moves to the top bar (182 pt from the right on this model) | depends on the model | none, text only |
| iPad A16 (820×1180 pt), portrait and landscape | top bar | Share, right of the address | 120 pt from the right edge, top | top, `fromRight: 120` |

## Facts the design relies on

- **iOS has no install API and no reliable event** when the Share sheet opens or closes (`blur`, `visibilitychange`,
  `pagehide` and `visualViewport` stay silent). Only the «Add to Home Screen» dialog fires `blur`. So the iOS hint never
  moves on by itself (`sheetSignal: null`), and there is no «Next» on the page (tapping it closes the sheet).
- The Share sheet opens at half height: a hint pinned at the top stays readable until «View More» expands it.
- Scrolling collapses Safari's bar; the assistant scrolls to the top on «Start» and the hint says to tap the address.
- `beforeinstallprompt` does **not** fire on load on a first visit (it came after interaction and ~30 s on the page in
  the emulator). Until then the menu guide shows; the assistant appears when it arrives.
- Dismissing the native dialog makes Chrome fire `beforeinstallprompt` again: back to step 1 with «Try again».
- Without a WebAPK (e.g. localhost) Chrome makes a shortcut and the **launcher asks to confirm after `appinstalled`**;
  the assistant says to accept it.
- Success on iOS is only detectable once the icon is opened (`navigator.standalone`, `display-mode: standalone`).

## Pending verification

- Safari 17/18 on iPhone and iPad (the `legacy` rows of `ARROW_SPOTS`).
- Samsung Internet, Firefox, Edge, Opera and Brave on Android; a real WebAPK; `getInstalledRelatedApps`; a real device.
- **Browser labels in Portuguese, French, German and Italian** (`browser.*` in those packs): written from the browsers'
  usual wording, not yet checked on a device in each language. English and Spanish follow the reference.

Test on a device without changing the table: `debug: true` turns every implemented flow on and logs page events.
