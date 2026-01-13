import { JSXElement } from "solid-js";
import { VersionButton } from "./VersionButton";
import { Button } from "./Button";
import { showModal } from "../stores/modals";
// import * as CommandLine from "../commandline/commandline";
import "./Footer.scss";
import { ThemeIndicator } from "./ThemeIndicator";
import { ScrollToTop } from "./ScrollToTop";
import { Anchor } from "./Anchor";

export function Footer(): JSXElement {
  return (
    <footer>
      <ScrollToTop />
      <div
        id="commandLineMobileButton"
        onClick={() => {
          showModal("Commandline");
        }}
      >
        <i class="fas fa-terminal"></i>
      </div>

      <div class="keyTips">
        <kbd>tab</kbd> and <kbd>enter</kbd> - restart Test
        <br />
        <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> + <kbd>p</kbd> or <kbd>esc</kbd>{" "}
        - command Line
      </div>

      <div class="leftright">
        <div class="left">
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
          <Anchor
            type="text"
            text="github"
            icon="fas fa-code"
            fixedWidthIcon
            href="https://github.com/monkeytypegame/monkeytype"
          />
          <Anchor
            type="text"
            text="discord"
            icon="fab fa-discord"
            fixedWidthIcon
            href="https://www.discord.gg/monkeytype"
          />
          <Anchor
            type="text"
            text="twitter"
            icon="fab fa-twitter"
            fixedWidthIcon
            href="https://x.com/monkeytype"
          />
          <Anchor
            type="text"
            text="terms"
            icon="fas fa-file-contract"
            fixedWidthIcon
            href="/terms-of-service.html"
          />
          <Anchor
            href="/security-policy.html"
            type="text"
            text="security"
            icon="fas fa-shield-alt"
            fixedWidthIcon
          />
          <Anchor
            href="/privacy-policy.html"
            type="text"
            text="privacy"
            icon="fas fa-lock"
            fixedWidthIcon
          />
        </div>
        <div class="right">
          <ThemeIndicator />
          <VersionButton />
        </div>
      </div>
    </footer>
  );
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
