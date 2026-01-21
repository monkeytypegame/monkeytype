import { JSXElement } from "solid-js";

import { setCommandlineSubgroup } from "../../signals/core";
import { showModal } from "../../stores/modals";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

export function SupportModal(): JSXElement {
  const buttonClass = "p-4 flex flex-col text-md";
  const iconScale = 2;

  return (
    <AnimatedModal
      id="Support"
      title="Support Monkeytype"
      modalClass="max-w-4xl"
    >
      <div>
        Thank you so much for thinking about supporting this project. It would
        not be possible without you and your continued support.{" "}
        <i class="fas fa-heart"></i>
      </div>
      <div class="xs:grid-cols-2 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Button
          type="button"
          onClick={() => {
            setCommandlineSubgroup("ads");
            showModal("Commandline");
          }}
          icon="fas fa-ad"
          text="Enable Ads"
          fixedWidthIcon
          iconScale={iconScale}
          class={buttonClass}
        />
        <Button
          type="button"
          href="https://ko-fi.com/monkeytype"
          icon="fas fa-donate"
          text="Donate"
          fixedWidthIcon
          iconScale={iconScale}
          class={buttonClass}
        />
        <Button
          type="button"
          href="https://www.patreon.com/monkeytype"
          icon="fab fa-patreon"
          text="Join Patreon"
          fixedWidthIcon
          iconScale={iconScale}
          class={buttonClass}
        />
        <Button
          type="button"
          href="https://monkeytype.store"
          icon="fas fa-tshirt"
          text="Buy Merch"
          fixedWidthIcon
          iconScale={iconScale}
          class={buttonClass}
        />
      </div>
    </AnimatedModal>
  );
}
