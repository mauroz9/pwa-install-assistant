# Real Safari on the iOS simulator

XCUITest drives **Safari itself** (and Settings and SpringBoard), not a WebView: it taps Safari's own toolbar,
the Share sheet, «View More», «Add to Home Screen», the switch and «Add», finds the icon on the Home Screen and
opens it. The page is the demo with `debug: true`, whose event log the test reads from the accessibility tree,
including where the arrow really is (`arrow: cx=… fromRight=…`), to compare with the button measured by XCUITest.

## Run

```bash
npm run build && npm run build -w demo
npx vite preview demo --port 4173 --strictPort &      # the simulator reaches the Mac's localhost

brew install xcodegen                                   # once
xcrun simctl create "PIA iPhone 17" "iPhone 17" com.apple.CoreSimulator.SimRuntime.iOS-26-3
xcrun simctl create "PIA iPad A16" "iPad (A16)" com.apple.CoreSimulator.SimRuntime.iOS-26-3
xcrun simctl boot <udid> && open -a Simulator

cd e2e/ios
LAYOUT=Compact ./run.sh <iphone-udid> SettingsTests/testSafariLayout      # Compact | Bottom | Top
BAR_OPTION=Compact TAG=compact ./run.sh <iphone-udid> InstallFlowTests/testFlow
DEVICE=ipad TAG=ipad ./run.sh <ipad-udid> InstallFlowTests/testFlow
```

`run.sh` generates the project with XcodeGen and builds it once (`build/`), then runs one test and prints the
`PROBE-*` lines and the page events. Screenshots go to `results/shots/`. Labels are matched in English and
Spanish (the simulator follows the Mac's language).

Disk: the two simulators take ~3–4 GB once used; delete them with `xcrun simctl delete <udid>` when done.
