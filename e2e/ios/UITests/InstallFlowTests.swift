import XCTest

/// Walks the demo (`/?lang=en&debug=1`) in Safari: the assistant, «Start», the Share sheet (through «•••» when
/// needed), «Add to Home Screen» (cancel once, then add), the icon on the Home Screen and the launch as an app.
/// Reads the page's event log after each step. env: BASE_URL, BAR_OPTION (toolbar option on the page),
/// TAG (screenshot prefix), DEVICE (iphone/ipad), APP_NAME (icon label), STOP_AFTER_START.
final class InstallFlowTests: XCTestCase {
  let diag = DiagLog()
  var tag: String { env["TAG"] ?? "x" }
  var appName: String { env["APP_NAME"] ?? "Acme Notes" }

  override func setUp() { continueAfterFailure = true }

  func s(_ name: String) { shot("\(tag)-\(name)") }

  /// Scrolls the page until the element can be tapped without a bar over it.
  func reveal(_ el: XCUIElement) {
    let h = safari.windows.firstMatch.frame.height
    var tries = 0
    while tries < 25 {
      // (A radio's label is not always "hittable" for XCUITest: being on screen is enough.)
      if el.exists && el.frame.minY > 130 && el.frame.maxY < h - 160 { return }
      let up = !el.exists || el.frame.minY > h - 160
      let a = safari.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? 0.62 : 0.38))
      a.press(forDuration: 0.05, thenDragTo: safari.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? 0.38 : 0.62)))
      usleep(500_000); tries += 1
    }
  }

  func web(_ label: String) -> XCUIElement {
    safari.webViews.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
  }

  /// Safari's own button (outside the page) that opens Share or the «•••» menu.
  func entryButton() -> XCUIElement? {
    for l in L.share + L.more {
      let q = safari.buttons.matching(NSPredicate(format: "label == %@", l))
      for i in 0..<q.count {
        let b = q.element(boundBy: i)
        if b.exists && b.isHittable { return b }
      }
    }
    return nil
  }

  @discardableResult
  func openShareSheet(_ label: String) -> Bool {
    if entryButton() == nil {
      // The bar is collapsed (after scrolling): only the address in small type. Tapping it expands it.
      s("\(label)-bar-collapsed")
      let pill = first(safari.textFields, L.address, timeout: 1)
      let pillY: CGFloat = env["DEVICE"] == "ipad" ? 0.028 : 0.97
      if let pill, pill.isHittable { pill.tap() } else { safari.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: pillY)).tap() }
      sleep(2)
    }
    guard let entry = entryButton() else { XCTFail("no Share/••• button"); return false }
    frameOf(entry, "\(tag)-button-\(entry.label)")
    let viaMore = L.more.contains(entry.label)
    entry.tap(); sleep(2)
    if viaMore {
      s("\(label)-menu")
      diag.read("\(label): ••• menu open")
      guard let share = first(safari.buttons, L.share, timeout: 3) else { XCTFail("no Share in •••"); return false }
      share.tap(); sleep(2)
    }
    s("\(label)-sheet")
    diag.read("\(label): sheet open")
    return true
  }

  func closeSheet() {
    if let close = first(safari.buttons, L.close, timeout: 2) { close.tap() } else {
      safari.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.12)).tap()
    }
    sleep(2)
  }

  func addToHome() -> XCUIElement? {
    if let more = first(safari.cells, L.viewMore, timeout: 2) { more.tap(); sleep(2) }
    let add = first(safari.descendants(matching: .any), L.addToHome, timeout: 4)
    if let add {
      if !add.isHittable { safari.swipeUp(velocity: .slow); sleep(1) }
      add.tap(); sleep(3)
    }
    return add
  }

  func findIcon() -> XCUIElement {
    XCUIDevice.shared.press(.home); sleep(1)
    XCUIDevice.shared.press(.home); sleep(1)
    let icon = springboard.icons[appName]
    var pages = 0
    while icon.exists && !icon.isHittable && pages < 3 { springboard.swipeLeft(); sleep(1); pages += 1 }
    return icon
  }

  func removeIcon() {
    let icon = findIcon()
    guard icon.exists && icon.isHittable else { return }
    icon.press(forDuration: 1.5); sleep(1)
    if let del = first(springboard.buttons, L.delete, timeout: 2) { del.tap(); sleep(1) }
    if let ok = first(springboard.buttons, ["Delete", "Eliminar"], timeout: 2) { ok.tap(); sleep(1) }
    print("PROBE-ICON-REMOVED \(!springboard.icons[appName].exists)")
  }

  /// Opens the icon and checks that the page runs as an app and shows «It's already installed!».
  func openIcon() {
    let icon = findIcon()
    s("07-home")
    XCTAssertTrue(icon.exists && icon.isHittable, "no \(appName) icon")
    guard icon.exists && icon.isHittable else { return }
    icon.tap(); sleep(6)
    s("08-app")
    let webapp = XCUIApplication(bundleIdentifier: "com.apple.webapp")
    print("PROBE-APPSTATE webapp=\(webapp.state.rawValue) safari=\(safari.state.rawValue)")
    XCTAssertEqual(webapp.state, .runningForeground, "not running as a web app")
    let texts = webapp.staticTexts.allElementsBoundByIndex.prefix(60).map { $0.label }
    print("PROBE-WEBAPP-TEXTS \(texts)")
    // The start_url has no ?lang, so the page follows the device language.
    XCTAssertTrue(texts.contains("It's already installed!") || texts.contains("¡Ya está instalada!"), "the page does not say it is installed")
    print("PROBE-WEBAPP-HAS-URLBAR \(first(webapp.textFields, L.address, timeout: 1) != nil)")
  }

  func testOpenIcon() throws { openIcon() }

  func testFlow() throws {
    removeIcon()
    let base = env["BASE_URL"] ?? "http://localhost:4173"
    XCUIDevice.shared.orientation = .portrait
    XCUIDevice.shared.system.open(URL(string: base + "/?lang=en&debug=1")!)
    XCTAssertTrue(safari.wait(for: .runningForeground, timeout: 20))
    sleep(5)
    // Safari 26's welcome tip (first run only).
    if let tip = first(safari.buttons, L.close, timeout: 1) { tip.tap(); sleep(1) }
    diag.read("load")
    s("01-page")

    if let opt = env["BAR_OPTION"], !opt.isEmpty {
      let r = web(opt)
      reveal(r)
      sleep(1)
      if r.exists { r.tap(); sleep(1) } else { XCTFail("no option \(opt)") }
      if !safari.webViews.buttons["Start"].isEnabled { r.tap(); sleep(1) }
    }
    let start = safari.webViews.buttons["Start"]
    reveal(start)
    sleep(1)
    XCTAssertTrue(start.isEnabled, "Start disabled")
    start.tap(); sleep(2)
    print("PROBE-BAR-AFTER-START entry=\(entryButton()?.label ?? "none (bar collapsed)")")
    s("02-arrow")
    diag.read("start")
    if let b = entryButton() { frameOf(b, "\(tag)-entry") }
    if env["DEVICE"] == "ipad" {
      XCUIDevice.shared.orientation = .landscapeLeft; sleep(3)
      if entryButton() == nil {
        // Collapsed bar: tap the address pill (top centre) to expand it, then measure.
        safari.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.03)).tap(); sleep(2)
      }
      diag.read("landscape")
      if let b = entryButton() { frameOf(b, "\(tag)-landscape-entry") } else { print("PROBE-FRAME \(tag)-landscape-entry none") }
      s("02-arrow-landscape")
      XCUIDevice.shared.orientation = .portrait; sleep(3)
    }
    if env["STOP_AFTER_START"] == "1" { return }
    dump(safari, "\(tag)-after-start")

    // 1) Open and close without choosing anything.
    if openShareSheet("03") {
      closeSheet()
      diag.read("03: sheet closed")
    }
    // 2) The «Add» dialog, cancelled.
    if openShareSheet("04"), addToHome() != nil {
      s("05-dialog")
      diag.read("05: dialog open")
      if let cancel = first(safari.buttons, L.cancel + L.close, timeout: 2) { cancel.tap() }
      sleep(2)
      closeSheet()
      diag.read("05: dialog cancelled")
    }
    // 3) Add for real, with «Open as Web App» on.
    if openShareSheet("06"), addToHome() != nil {
      let sw = safari.switches.firstMatch
      print("PROBE-SWITCH '\(sw.label)' value=\(String(describing: sw.value))")
      XCTAssertEqual(sw.value as? String, "1", "«Open as Web App» is off")
      s("06-dialog")
      if let add = first(safari.buttons, L.add, timeout: 2) { add.tap() } else { XCTFail("no «Add»") }
      sleep(3)
      diag.read("06: added")
    }
    // 4) Home Screen → icon → app mode.
    openIcon()
  }
}
