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
      class={cn("text-sub relative text-xs", {
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
        <div class="xs:grid-cols-2 grid grid-cols-1 justify-items-start sm:grid-cols-4 lg:flex">
          <Button
            type="text"
            text="contact"
            fa={{
              icon: "envelope",
              fixedWidth: true,
            }}
            onClick={() => showModal("Contact")}
          />
          <Button
            type="text"
            text="support"
            fa={{
              icon: "donate",
              fixedWidth: true,
            }}
            onClick={() => showModal("Support")}
          />
          <Button
            type="text"
            text="github"
            fa={{
              icon: "code",
              fixedWidth: true,
            }}
            href="https://github.com/monkeytypegame/monkeytype"
          />
          <Button
            type="text"
            text="discord"
            fa={{
              icon: "discord",
              variant: "brand",
              fixedWidth: true,
            }}
            href="https://www.discord.gg/monkeytype"
          />
          <Button
            type="text"
            text="twitter"
            fa={{
              icon: "twitter",
              variant: "brand",
              fixedWidth: true,
            }}
            href="https://x.com/monkeytype"
          />
          <Button
            type="text"
            text="terms"
            fa={{
              icon: "file-contract",
              fixedWidth: true,
            }}
            href="/terms-of-service.html"
          />
          <Button
            href="/security-policy.html"
            type="text"
            text="security"
            fa={{
              icon: "shield-alt",
              fixedWidth: true,
            }}
          />
          <Button
            href="/privacy-policy.html"
            type="text"
            text="privacy"
            fa={{
              icon: "lock",
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
