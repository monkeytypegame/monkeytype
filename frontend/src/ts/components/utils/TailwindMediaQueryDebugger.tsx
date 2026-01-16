import { JSXElement } from "solid-js";

export function TailwindMediaQueryDebugger(): JSXElement {
  return (
    <div class="fixed left-2 top-12 z-999999999999999 bg-sub-alt text-text px-2 py-1  font-bold font-mono rounded shadow-lg">
      <div class="hidden 2xl:block">2xl</div>
      <div class="hidden xl:block 2xl:hidden">xl</div>
      <div class="hidden lg:block xl:hidden">lg</div>
      <div class="hidden md:block lg:hidden">md</div>
      <div class="hidden sm:block md:hidden">sm</div>
      <div class="hidden xs:block sm:hidden">xs</div>
      <div class="xs:hidden">xxs</div>
    </div>
  );
}
