import { JSXElement } from "solid-js";

import { getFocus } from "../../../signals/core";
import { showModal } from "../../../stores/modals";
import { Button } from "../../common/Button";

import { ScrollToTop } from "./ScrollToTop";
import { ThemeIndicator } from "./ThemeIndicator";
import { VersionButton } from "./VersionButton";

export function Footer(): JSXElement {
  return (
    <div class="text-sub relative text-xs">
      <ScrollToTop />
      <button
        type="button"
        id="commandLineMobileButton"
        class="bg-main text-bg fixed bottom-8 left-8 z-99 hidden h-12 w-12 rounded-full text-center leading-12"
        onClick={() => {
          showModal("Commandline");
        }}
        tabIndex="-1"
      >
        <i class="fas fa-terminal"></i>
      </button>

      <div
        class="mb-8 text-center leading-loose transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <kbd>tab</kbd> and <kbd>enter</kbd> - restart test
        <br />
        <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd>{" "}
        - command line
      </div>

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
            icon="fas fa-envelope"
            fixedWidthIcon
            onClick={() => showModal("Contact")}
          />
          <Button
            type="text"
            text="support"
            icon="fas fa-donate"
            fixedWidthIcon
            onClick={() => showModal("Support")}
          />
          <Button
            type="text"
            text="github"
            icon="fas fa-code"
            fixedWidthIcon
            href="https://github.com/monkeytypegame/monkeytype"
          />
          <Button
            type="text"
            text="discord"
            icon="fab fa-discord"
            fixedWidthIcon
            href="https://www.discord.gg/monkeytype"
          />
          <Button
            type="text"
            text="twitter"
            icon="fab fa-twitter"
            fixedWidthIcon
            href="https://x.com/monkeytype"
          />
          <Button
            type="text"
            text="terms"
            icon="fas fa-file-contract"
            fixedWidthIcon
            href="/terms-of-service.html"
          />
          <Button
            href="/security-policy.html"
            type="text"
            text="security"
            icon="fas fa-shield-alt"
            fixedWidthIcon
          />
          <Button
            href="/privacy-policy.html"
            type="text"
            text="privacy"
            icon="fas fa-lock"
            fixedWidthIcon
          />
        </div>
        <div class="flex flex-col items-end text-right lg:flex-row">
          <ThemeIndicator />
          <VersionButton />
        </div>
      </div>
    </div>
  );
}
