import { JSXElement } from "solid-js";
import { VersionButton } from "./VersionButton";
import { TextButton } from "./TextButton";
import { showModal } from "../stores/modals";
import * as CommandLine from "../commandline/commandline";
import "./Footer.scss";
import { ThemeIndicator } from "./ThemeIndicator";
import { ScrollToTop } from "./ScrollToTop";

export function Footer(): JSXElement {
  return (
    <footer>
      <ScrollToTop />
      <div
        id="commandLineMobileButton"
        onClick={() =>
          CommandLine.show({
            singleListOverride: false,
          })
        }
      >
        <i class="fas fa-terminal"></i>
      </div>

      <div class="keyTips">
        <kbd>tab</kbd>
        and
        <kbd>enter</kbd>- Restart Test
        <br />
        <kbd>ctrl/cmd</kbd>+<kbd>shift</kbd>+<kbd>p</kbd>
        or
        <kbd>esc</kbd>- Command Line
      </div>

      <div class="leftright">
        <div class="left">
          <TextButton icon="fa-envelope" onClick={() => showModal("Contact")}>
            <div class="text">contact</div>
          </TextButton>

          <TextButton icon="fa-donate" onClick={() => showModal("Support")}>
            <div class="text">support</div>
          </TextButton>

          <a
            href="https://github.com/monkeytypegame/monkeytype"
            class="textButton"
            type="button"
            target="_blank"
            rel="noreferrer noopener"
          >
            <i class="fas fa-fw fa-code"></i>
            <div class="text">github</div>
          </a>
          <a
            href="https://www.discord.gg/monkeytype"
            class="textButton discordLink"
            target="_blank"
            rel="noreferrer noopener"
          >
            <i class="fab fa-fw fa-discord"></i>
            <div class="text">discord</div>
          </a>
          <a
            href="https://x.com/monkeytype"
            class="textButton"
            type="button"
            target="_blank"
            rel="noreferrer noopener"
          >
            <i class="fab fa-fw fa-twitter"></i>
            <div class="text">twitter</div>
          </a>
          <a
            href="/terms-of-service.html"
            class="textButton"
            type="button"
            target="_blank"
          >
            <i class="fas fa-fw fa-file-contract"></i>
            <div class="text">terms</div>
          </a>
          <a
            href="/security-policy.html"
            class="textButton"
            type="button"
            target="_blank"
          >
            <i class="fas fa-fw fa-shield-alt"></i>
            <div class="text">security</div>
          </a>
          <a
            href="/privacy-policy.html"
            class="textButton"
            type="button"
            target="_blank"
          >
            <i class="fas fa-fw fa-lock"></i>
            <div class="text">privacy</div>
          </a>
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
