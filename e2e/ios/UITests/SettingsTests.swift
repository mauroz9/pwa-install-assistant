import XCTest

/// Sets Safari's tab layout in Settings › Apps › Safari (env LAYOUT = label of the option:
/// Compact / Bottom / Top, or Compacta / Abajo / Arriba). Without LAYOUT, dumps the screen.
final class SettingsTests: XCTestCase {
  let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")

  func reveal(_ el: XCUIElement) -> XCUIElement {
    var tries = 0
    while !(el.exists && el.isHittable && el.frame.maxY < settings.frame.maxY - 60) && tries < 10 {
      settings.swipeUp(velocity: .slow); tries += 1
    }
    return el
  }

  func testSafariLayout() throws {
    settings.terminate()
    settings.launch()
    sleep(2)
    reveal(settings.buttons["com.apple.settings.apps"]).tap()
    sleep(2)
    let search = settings.searchFields.firstMatch
    if search.waitForExistence(timeout: 3) { search.tap(); search.typeText("Safari"); sleep(2) }
    let row = settings.descendants(matching: .any).matching(NSPredicate(
      format: "label == 'Safari' AND (elementType == %d OR elementType == %d)",
      XCUIElement.ElementType.button.rawValue, XCUIElement.ElementType.cell.rawValue)).firstMatch
    row.tap()
    sleep(2)
    let layout = env["LAYOUT"] ?? ""
    if layout.isEmpty {
      for i in 0..<4 { shot("settings-safari-\(i)"); dump(settings, "settings-\(i)"); settings.swipeUp(velocity: .slow) }
      return
    }
    let names = ["Compact": "Compacta", "Bottom": "Abajo", "Top": "Arriba"]
    let labels = [layout] + (names[layout].map { [$0] } ?? [])
    var option: XCUIElement?
    for _ in 0..<8 {
      for label in labels {
        let b = settings.buttons.matching(NSPredicate(format: "label == %@", label)).firstMatch
        if b.exists && b.isHittable && b.frame.maxY < settings.frame.maxY - 40 { option = b }
      }
      if option != nil { break }
      settings.swipeUp(velocity: .slow)
    }
    guard let option else { XCTFail("no option \(layout)"); return }
    option.tap(); sleep(1)
    shot("settings-safari-\(layout)")
  }
}
