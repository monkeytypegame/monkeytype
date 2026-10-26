import { createSignal, JSXElement, Show } from "solid-js";

const [isVisible, setVisible] = createSignal(false);
const [showWaitMessage, setShowWaitMessage] = createSignal(false);

export function fixSkillIssue(): void {
  setVisible(true);
  setTimeout(() => setShowWaitMessage(true), 5000);
}

/** Easter egg: covers the whole app, there's no way back short of a reload */
export function SkillIssueFix(): JSXElement {
  return (
    <Show when={isVisible()}>
      <div class="fixed inset-0 z-99999 bg-bg text-text">
        <div class="pointer-events-none fixed top-1/2 left-1/2 w-full max-w-200 -translate-1/2 text-center">
          <h1 class="mb-4 text-[3rem]">Fixing skill issue...</h1>
          <iframe
            class="aspect-4/3 w-full border-0"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=Kr48u8WHcwvX95G7&controls=0&autoplay=1&mute=0&disablekb=1&fs=0&modestbranding=1"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
          <Show when={showWaitMessage()}>
            <p class="mt-4 text-[1.5rem]">
              If your skill issue is not fixed yet, please wait a bit longer...
            </p>
          </Show>
        </div>
      </div>
    </Show>
  );
}
