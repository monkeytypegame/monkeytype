import { JSXElement } from "solid-js";
import { AnimatedModal } from "./AnimatedModal";
import "./SupportModal.scss";
import * as Commandline from "../commandline/commandline";
import { hideModal, isModalOpen } from "../stores/modals";

export function SupportModal(): JSXElement {
  const isOpen = (): boolean => isModalOpen("Support");
  return (
    <AnimatedModal
      id="SupportModal"
      isOpen={isOpen()}
      onClose={() => hideModal("Support")}
    >
      <div class="title">Support Monkeytype</div>
      <div class="text">
        Thank you so much for thinking about supporting this project. It would
        not be possible without you and your continued support.
        <i class="fas fa-heart"></i>
      </div>
      <div class="buttons">
        <button
          class="ads"
          type="button"
          onClick={() =>
            Commandline.show(
              { subgroupOverride: "ads" },
              //TODO mio{          modalChain: modal,        }
            )
          }
        >
          <div class="icon">
            <i class="fas fa-fw fa-ad"></i>
          </div>
          <div class="text">Enable Ads</div>
        </button>
        <a
          class="button"
          href="https://ko-fi.com/monkeytype"
          target="_blank"
          rel="noreferrer noopener"
        >
          <div class="icon">
            <i class="fas fa-fw fa-donate"></i>
          </div>
          <div class="text">Donate</div>
        </a>
        <a
          class="button"
          href="https://www.patreon.com/monkeytype"
          target="_blank"
          rel="noreferrer noopener"
        >
          <div class="icon">
            <i class="fab fa-fw fa-patreon"></i>
          </div>
          <div class="text">Join Patreon</div>
        </a>
        <a
          class="button"
          href="https://monkeytype.store"
          target="_blank"
          rel="noreferrer noopener"
        >
          <div class="icon">
            <i class="fas fa-fw fa-tshirt"></i>
          </div>
          <div class="text">Buy Merch</div>
        </a>
      </div>
    </AnimatedModal>
  );
}
