import { describe, expect, it } from "vitest";
import { needsLauncherHint, nextPhase, promptStep, type PromptEvent, type PromptPhase } from "../src/core/machine";

const run = (events: PromptEvent[], from: PromptPhase = "ready") => events.reduce(nextPhase, from);

describe("Android flow (beforeinstallprompt)", () => {
  it("accepting and installing walks the four steps", () => {
    expect(promptStep(run([]))).toBe(0);
    expect(run(["open"])).toBe("prompting");
    expect(promptStep(run(["open"]))).toBe(1);
    expect(run(["open", "accepted"])).toBe("accepted");
    expect(promptStep(run(["open", "accepted"]))).toBe(2);
    expect(run(["open", "accepted", "appinstalled"])).toBe("installed");
    expect(promptStep("installed")).toBe(3);
  });

  it("dismissing goes back to step 1 and can be retried", () => {
    expect(run(["open", "dismissed"])).toBe("dismissed");
    expect(promptStep("dismissed")).toBe(0);
    expect(run(["open", "dismissed", "open"])).toBe("prompting");
  });

  it("appinstalled always wins (e.g. installed from the menu) and is never undone", () => {
    expect(run(["appinstalled"])).toBe("installed");
    expect(run(["appinstalled", "open", "dismissed"])).toBe("installed");
  });

  it("ignores answers out of order", () => {
    expect(run(["accepted"])).toBe("ready");
    expect(run(["dismissed"])).toBe("ready");
    expect(run(["open", "open"])).toBe("prompting");
  });

  it("the launcher hint (shortcut without WebAPK) shows only after accepting", () => {
    expect(needsLauncherHint("ready")).toBe(false);
    expect(needsLauncherHint("prompting")).toBe(false);
    expect(needsLauncherHint("dismissed")).toBe(false);
    expect(needsLauncherHint("accepted")).toBe(true);
    expect(needsLauncherHint("installed")).toBe(true);
  });
});
