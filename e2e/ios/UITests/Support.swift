import XCTest

/// Helpers to drive Safari and SpringBoard from XCUITest. Labels are matched in English and Spanish.
let env = ProcessInfo.processInfo.environment
let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

enum L {
  static let share = ["Share", "Compartir"]
  static let more = ["More", "Más"]
  static let viewMore = ["View More", "Ver más"]
  static let addToHome = ["Add to Home Screen", "Añadir a pantalla de inicio"]
  static let add = ["Add", "Añadir"]
  static let cancel = ["Cancel", "Cancelar"]
  static let close = ["Close", "Cerrar"]
  static let address = ["Address", "Dirección"]
  static let delete = ["Delete Bookmark", "Remove App", "Delete", "Eliminar marcador", "Eliminar app", "Eliminar"]
}

extension XCTestCase {
  func shot(_ name: String) {
    let s = XCUIScreen.main.screenshot()
    let a = XCTAttachment(screenshot: s)
    a.name = name
    a.lifetime = .keepAlways
    add(a)
    if let dir = env["SHOTS_DIR"] {
      try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
      try? s.pngRepresentation.write(to: URL(fileURLWithPath: "\(dir)/\(name).png"))
    }
    print("PROBE-SHOT \(name)")
  }

  /// Buttons, cells, switches and texts of the system UI (not the web page).
  func dump(_ app: XCUIApplication, _ tag: String) {
    let kinds = ["Button", "Cell", "Switch", "MenuItem", "TextField", "NavigationBar", "Sheet", "Icon"]
    let lines = app.debugDescription.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }
      .filter { l in kinds.contains { l.hasPrefix($0) } }
    print("PROBE-DUMP \(tag)\n" + lines.map { "  " + $0 }.joined(separator: "\n"))
  }

  /// Centre of a system button, in points from the window edges.
  func frameOf(_ el: XCUIElement, _ tag: String) {
    let w = safari.windows.firstMatch.frame
    let f = el.frame
    print("PROBE-FRAME \(tag) center=(\(f.midX), \(f.midY)) fromRight=\(w.width - f.midX) fromBottom=\(w.height - f.midY) window=\(w.size)")
  }
}

/// Reads the page's diagnostics panel (`debug: true`) from one accessibility snapshot and prints new entries.
final class DiagLog {
  var seen = Set<String>()
  func read(_ tag: String) {
    let text = safari.debugDescription
    let re = try! NSRegularExpression(pattern: "label: '([0-9]+\\.[0-9]{2}s [^']*)'")
    var fresh: [String] = []
    for m in re.matches(in: text, range: NSRange(text.startIndex..., in: text)) {
      let l = String(text[Range(m.range(at: 1), in: text)!])
      if !seen.contains(l) { seen.insert(l); fresh.append(l) }
    }
    fresh.sort { (Double($0.split(separator: "s").first ?? "0") ?? 0) < (Double($1.split(separator: "s").first ?? "0") ?? 0) }
    print("PROBE-EVENTS \(tag) (\(fresh.count) new)\n" + fresh.map { "  " + $0 }.joined(separator: "\n"))
  }
}

func first(_ q: XCUIElementQuery, _ labels: [String], timeout: TimeInterval = 5) -> XCUIElement? {
  let deadline = Date().addingTimeInterval(timeout)
  repeat {
    for l in labels {
      let e = q.matching(NSPredicate(format: "label == %@", l)).firstMatch
      if e.exists { return e }
    }
    usleep(300_000)
  } while Date() < deadline
  return nil
}
