import { JSXElement } from "solid-js";

import { getFocus, getIsScreenshotting } from "../../../signals/core";
import { showModal } from "../../../stores/modals";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Keytips } from "./Keytips";
import { ThemeIndicator } from "./ThemeIndicator";
import { VersionButton } from "./VersionButton";

export function Footer(): JSXElement {
  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      <Keytips />

      <div
        class="-m-2 flex justify-between gap-8 transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <div class="grid grid-cols-1 justify-items-start xs:grid-cols-2 sm:grid-cols-4 lg:flex">
          <Button
            type="text"
            text="contact"
            fa={{
              icon: "fa-envelope",
              fixedWidth: true,
            }}
            onClick={() => showModal("Contact")}
          />
          <Button
            type="text"
            text="support"
            fa={{
              icon: "fa-donate",
              fixedWidth: true,
            }}
            onClick={() => showModal("Support")}
          />
          <Button
            type="text"
            text="github"
            fa={{
              icon: "fa-code",
              fixedWidth: true,
            }}
            href="https://github.com/monkeytypegame/monkeytype"
          />
          <Button
            type="text"
            text="discord"
            fa={{
              icon: "fa-discord",
              variant: "brand",
              fixedWidth: true,
            }}
            href="https://www.discord.gg/monkeytype"
          />
          <Button
            type="text"
            text="twitter"
            fa={{
              icon: "fa-twitter",
              variant: "brand",
              fixedWidth: true,
            }}
            href="https://x.com/monkeytype"
          />
          <Button
            type="text"
            text="terms"
            fa={{
              icon: "fa-file-contract",
              fixedWidth: true,
            }}
            href="/terms-of-service.html"
          />
          <Button
            href="/security-policy.html"
            type="text"
            text="security"
            fa={{
              icon: "fa-shield-alt",
              fixedWidth: true,
            }}
          />
          <Button
            href="/privacy-policy.html"
            type="text"
            text="privacy"
            fa={{
              icon: "fa-lock",
              fixedWidth: true,
            }}
          />
        </div>
        <div class="flex flex-col items-end text-right lg:flex-row">
          <ThemeIndicator />
          <VersionButton />
        </div>
      </div>
    </footer>
  );
}
