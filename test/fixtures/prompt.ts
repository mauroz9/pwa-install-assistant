import { vi } from "vitest";

/** A `beforeinstallprompt` like Chrome's, with the answer chosen by the test. */
export function fakePromptEvent(outcome: "accepted" | "dismissed" = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = vi.fn(async () => {});
  event.userChoice = Promise.resolve({ outcome });
  return event;
}
