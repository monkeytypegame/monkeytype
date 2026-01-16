import { JSXElement } from "solid-js";
import { VersionButton } from "./VersionButton";
import { Button } from "../../common/Button";
import { showModal } from "../../../stores/modals";
import "./Footer.scss";
import { ThemeIndicator } from "./ThemeIndicator";
import { ScrollToTop } from "./ScrollToTop";

export function Footer(): JSXElement {
  return (
    <footer class="relative text-xs text-sub">
      {/* Tailwind Breakpoint Debug Indicator */}
      {/* <div class="fixed bottom-4 right-4 z-[999999999999999] bg-main text-white px-4 py-2 text-2xl font-bold font-mono rounded shadow-lg">
        <div class="display-none 2xl:block">2xl</div>
        <div class="display-none xl:block 2xl:display-none">xl</div>
        <div class="display-none lg:block xl:display-none">lg</div>
        <div class="display-none md:block lg:display-none">md</div>
        <div class="display-none sm:block md:display-none">sm</div>
        <div class="display-none xs:block sm:display-none">xs</div>
        <div class="xs:display-none">xxs</div>
      </div> */}
      <div class="fixed bottom-4 left-4 z-[999999999999999] text-white px-4 py-2 text-2xl font-bold font-mono rounded shadow-lg">
        <div class="bg-gray-500 xxs:bg-amber-800 xs:bg-purple-500 sm:bg-blue-400 md:bg-green-400 lg:bg-amber-500 xl:bg-yellow-400 2xl:bg-red-500">
          query
        </div>
      </div>

      <ScrollToTop />
      <div
        id="commandLineMobileButton"
        onClick={() => {
          showModal("Commandline");
        }}
      >
        <i class="fas fa-terminal"></i>
      </div>

      <div class="text-center mb-8 leading-loose">
        <kbd>tab</kbd> and <kbd>enter</kbd> - restart test
        <br />
        <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd>{" "}
        - command line
      </div>

      <div class="-m-2 flex justify-between gap-8 sm:grid sm:grid-cols-2">
        <div class="text-left flex w-max justify-items-start lg:grid lg:grid-cols-4 sm:w-[unset] sm:grid-cols-[repeat(auto-fit, minmax(5rem,1fr))]">
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
        <div class="text-right flex w-max h-max justify-items-end lg:grid lg:grid-cols-2 ">
          <ThemeIndicator />
          <VersionButton />
        </div>
      </div>
    </footer>
  );
}
