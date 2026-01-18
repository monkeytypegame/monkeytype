import { JSXElement, Show } from "solid-js";
import { isDevEnvironment } from "../../utils/misc";

export function TailwindMediaQueryDebugger(): JSXElement {
  return (
    <Show when={isDevEnvironment()}>
      <div class="fixed top-12 left-2 z-999999999999999 rounded bg-sub-alt px-2 py-1 font-mono font-bold text-text shadow-lg">
        <div class="hidden 2xl:block">2xl</div>
        <div class="hidden xl:block 2xl:hidden">xl</div>
        <div class="hidden lg:block xl:hidden">lg</div>
        <div class="hidden md:block lg:hidden">md</div>
        <div class="hidden sm:block md:hidden">sm</div>
        <div class="hidden xs:block sm:hidden">xs</div>
        <div class="xs:hidden">xxs</div>
      </div>
    </Show>
  );
}
