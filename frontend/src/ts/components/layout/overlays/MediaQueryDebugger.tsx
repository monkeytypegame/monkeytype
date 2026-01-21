import { JSXElement, Match, Show, Switch } from "solid-js";

import { bp } from "../../../signals/breakpoints";
import { isDevEnvironment } from "../../../utils/misc";

export function MediaQueryDebugger(): JSXElement {
  return (
    <Show when={isDevEnvironment()}>
      <div class="text-text fixed top-2 z-999999999999999 flex flex-col gap-2 font-mono text-xs">
        <div class="bg-sub-alt flex w-min rounded-r px-2 py-1">
          <div class="mr-2">OLD</div>
          <div class="hidden 2xl:block">red</div>
          <div class="hidden xl:block 2xl:hidden">orange</div>
          <div class="hidden lg:block xl:hidden">yellow</div>
          <div class="hidden md:block lg:hidden">green</div>
          <div class="hidden sm:block md:hidden">blue</div>
          <div class="xs:block hidden sm:hidden">purple</div>
          <div class="xs:hidden">gray</div>
        </div>
        <div class="bg-sub-alt flex w-min rounded-r px-2 py-1">
          <div class="mr-2">CSS</div>
          <div class="hidden 2xl:block">2xl</div>
          <div class="hidden xl:block 2xl:hidden">xl</div>
          <div class="hidden lg:block xl:hidden">lg</div>
          <div class="hidden md:block lg:hidden">md</div>
          <div class="hidden sm:block md:hidden">sm</div>
          <div class="xs:block hidden sm:hidden">xs</div>
          <div class="xs:hidden">xxs</div>
        </div>
        <div class="bg-sub-alt flex w-min rounded-r px-2 py-1">
          <div class="mr-2">JS</div>
          <Switch>
            <Match when={bp().xxl}>2xl</Match>
            <Match when={bp().xl}>xl</Match>
            <Match when={bp().lg}>lg</Match>
            <Match when={bp().md}>md</Match>
            <Match when={bp().sm}>sm</Match>
            <Match when={bp().xs}>xs</Match>
            <Match when={bp().xxs}>xxs</Match>
          </Switch>
        </div>
      </div>
    </Show>
  );
}
