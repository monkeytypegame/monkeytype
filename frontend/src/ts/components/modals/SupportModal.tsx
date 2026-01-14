import { JSXElement } from "solid-js";
import { AnimatedModal } from "../common/AnimatedModal";
import "./SupportModal.scss";
import { showModal } from "../../stores/modals";
import { setCommandlineSubgroup } from "../../signals/core";
import { Button } from "../common/Button";

export function SupportModal(): JSXElement {
  return (
    <AnimatedModal id="Support">
      <div class="title">Support Monkeytype</div>
      <div class="text">
        Thank you so much for thinking about supporting this project. It would
        not be possible without you and your continued support.
        <i class="fas fa-heart"></i>
      </div>
      <div class="buttons">
        <Button
          type="button"
          onClick={() => {
            setCommandlineSubgroup("ads");
            showModal("Commandline");
          }}
          icon="fas fa-ad"
          text="Enable Ads"
          fixedWidthIcon
        />
        <Button
          type="button"
          href="https://ko-fi.com/monkeytype"
          icon="fas fa-donate"
          text="Donate"
          fixedWidthIcon
        />
        <Button
          type="button"
          href="https://www.patreon.com/monkeytype"
          icon="fab fa-patreon"
          text="Join Patreon"
          fixedWidthIcon
        />
        <Button
          type="button"
          href="https://monkeytype.store"
          icon="fas fa-tshirt"
          text="Buy Merch"
          fixedWidthIcon
        />
      </div>
    </AnimatedModal>
  );
}
