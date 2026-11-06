#!/bin/zsh
# Runs one XCUITest on a simulator.
# usage: [BASE_URL=..] [BAR_OPTION=..] [LAYOUT=..] [TAG=..] [DEVICE=iphone|ipad] run.sh <udid> <Class/testMethod> [out]
set -u
cd "$(dirname $0)"
OUT=${3:-results/$(date +%H%M%S)}
mkdir -p results
if [ ! -d PiaProbe.xcodeproj ]; then xcodegen generate >/dev/null; fi
if [ ! -d build/Build/Products ]; then
  xcodebuild -project PiaProbe.xcodeproj -scheme Probe -destination "id=$1" -derivedDataPath build build-for-testing > results/build.log 2>&1 || { echo "build failed: results/build.log"; exit 1; }
fi
export TEST_RUNNER_BASE_URL=${BASE_URL:-http://localhost:4173} TEST_RUNNER_DEVICE=${DEVICE:-iphone} \
  TEST_RUNNER_SHOTS_DIR=${SHOTS_DIR:-$PWD/results/shots} TEST_RUNNER_LAYOUT=${LAYOUT:-} TEST_RUNNER_TAG=${TAG:-x} \
  TEST_RUNNER_BAR_OPTION=${BAR_OPTION:-} TEST_RUNNER_STOP_AFTER_START=${STOP_AFTER_START:-} TEST_RUNNER_APP_NAME=${APP_NAME:-Acme Notes}
rm -rf "$OUT.xcresult"
xcodebuild -project PiaProbe.xcodeproj -scheme Probe -destination "id=$1" -derivedDataPath build test-without-building \
  -only-testing:ProbeUITests/$2 -resultBundlePath "$OUT.xcresult" > "$OUT.log" 2>&1
RC=$?
rm -rf "$OUT.xcresult"
echo "exit $RC -> $OUT.log"
grep -E "PROBE-(FRAME|EVENTS|APPSTATE|WEBAPP|SWITCH|BAR)|  [0-9]+\.[0-9]{2}s|error:|failed" "$OUT.log" | head -80
exit $RC
