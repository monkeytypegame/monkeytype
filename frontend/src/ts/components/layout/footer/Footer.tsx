import { For, JSXElement } from "solid-js";

import { getIsScreenshotting } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Keytips } from "./Keytips";
import { ThemeIndicator } from "./ThemeIndicator";
import { VersionButton } from "./VersionButton";

const TICKER = [
  "type",
  "code",
  "break",
  "repeat",
  "type",
  "code",
  "break",
  "repeat",
];

export function Footer(): JSXElement {
  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      <Keytips />

      <div
        class={cn("-m-2 flex justify-between gap-8 transition-opacity", {
          "opacity-0": getFocus(),
        })}
      >
        <div class="grid grid-cols-1 justify-items-start xs:grid-cols-2 sm:grid-cols-4 lg:flex">
          <Button
            variant="text"
            text="email"
            fa={{
              icon: "fa-envelope",
              fixedWidth: true,
            }}
            href="mailto:recurse@kmit.in"
          />
          <Button
            variant="text"
            text="instagram"
            fa={{
              icon: "fa-instagram",
              variant: "brand",
              fixedWidth: true,
            }}
            href="https://www.instagram.com/recurse.official/"
          />
          <Button
            variant="text"
            text="recurse"
            fa={{
              icon: "fa-globe",
              fixedWidth: true,
            }}
            href="https://recurse.qzz.io"
          />
          <Button
            variant="text"
            text="github"
            fa={{
              icon: "fa-code",
              fixedWidth: true,
            }}
            href="https://github.com/aditya36900/monkeytype"
          />
          <Button
            variant="text"
            text="based on monkeytype (gpl-3.0)"
            fa={{
              icon: "fa-code-branch",
              fixedWidth: true,
            }}
            href="https://github.com/monkeytypegame/monkeytype"
          />
        </div>
        <div class="flex flex-col items-end text-right lg:flex-row">
          <ThemeIndicator />
          <VersionButton />
        </div>
      </div>
      <div
        aria-hidden="true"
        data-ui-element="recurseTicker"
        class={cn("transition-opacity", { "opacity-0": getFocus() })}
      >
        <div data-ui-element="recurseTickerTrack">
          <For each={[0, 1]}>
            {() => (
              <For each={TICKER}>
                {(word) => (
                  <span>
                    {word}
                    <i>+</i>
                  </span>
                )}
              </For>
            )}
          </For>
        </div>
      </div>
    </footer>
  );
}
