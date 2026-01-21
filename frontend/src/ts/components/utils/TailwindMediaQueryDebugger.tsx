import { JSXElement, Match, Show, Switch } from "solid-js";

import { bp } from "../../signals/breakpoints";
import { isDevEnvironment } from "../../utils/misc";

export function TailwindMediaQueryDebugger(): JSXElement {
  return (
    <Show when={isDevEnvironment()}>
      <div class="bg-sub-alt text-text fixed top-12 left-2 z-999999999999999 flex rounded px-2 py-1 font-mono font-bold shadow-lg">
        <div class="hidden 2xl:block">2xl</div>
        <div class="hidden xl:block 2xl:hidden">xl</div>
        <div class="hidden lg:block xl:hidden">lg</div>
        <div class="hidden md:block lg:hidden">md</div>
        <div class="hidden sm:block md:hidden">sm</div>
        <div class="xs:block hidden sm:hidden">xs</div>
        <div class="xs:hidden">xxs</div>
        <div>
          /
          <Switch>
            <Match when={bp().xxl}>2xl</Match>
            <Match when={bp().xl}>xl</Match>
            <Match when={bp().lg}>lg</Match>
            <Match when={bp().md}>md</Match>
            <Match when={bp().sm}>sm</Match>
            <Match when={bp().xs}>xs</Match>
          </Switch>
        </div>
      </div>
    </Show>
  );
}
