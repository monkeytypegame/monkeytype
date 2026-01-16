import { JSXElement } from "solid-js";
import { VersionButton } from "./VersionButton";
import { Button } from "../../common/Button";
import { showModal } from "../../../stores/modals";
import { ThemeIndicator } from "./ThemeIndicator";
import { ScrollToTop } from "./ScrollToTop";
import { getFocus } from "../../../signals/core";

export function Footer(): JSXElement {
  return (
    <footer class="relative text-xs text-sub">
      <div class="fixed left-2 top-12 z-999999999999999 bg-sub-alt text-text px-2 py-1  font-bold font-mono rounded shadow-lg">
        <div class="hidden 2xl:block">2xl</div>
        <div class="hidden xl:block 2xl:hidden">xl</div>
        <div class="hidden lg:block xl:hidden">lg</div>
        <div class="hidden md:block lg:hidden">md</div>
        <div class="hidden sm:block md:hidden">sm</div>
        <div class="hidden xs:block sm:hidden">xs</div>
        <div class="xs:hidden">xxs</div>
      </div>

      <ScrollToTop />
      <button
        type="button"
        id="commandLineMobileButton"
        class="grid bottom-8 left-8 fixed bg-main w-12 h-12 text-center leading-12 rounded-full text-bg z-99"
        onClick={() => {
          showModal("Commandline");
        }}
        tabIndex="-1"
      >
        <i class="fas fa-terminal"></i>
      </button>

      <div
        class="text-center mb-8 leading-loose transition-opacity"
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
        <div class="grid grid-cols-1 xs:grid-cols-2 justify-items-start sm:grid-cols-4 lg:flex">
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
        <div class="text-right flex flex-col items-end lg:flex-row">
          <ThemeIndicator />
          <VersionButton />
        </div>
      </div>
    </footer>
  );
}
