import { For, JSXElement, onCleanup, onMount, Show } from "solid-js";
import { debounce } from "throttle-debounce";

import { createEffectOn } from "../../../hooks/effects";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { showPopup } from "../../../modals/simple-modals-base";
import {
  Banner as BannerType,
  addBanner,
  getBanners,
  removeBanner,
} from "../../../states/banners";
import { setGlobalOffsetTop } from "../../../states/core";
import { getSnapshot } from "../../../states/snapshot";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";

function Banner(props: BannerType): JSXElement {
  const remove = (): void => {
    // document.startViewTransition(() => {
    removeBanner(props.id);
    // });
  };
  const icon = (): string =>
    props.icon === undefined || props.icon === ""
      ? "fa fa-fw fa-bullhorn"
      : props.icon;

  return (
    <div
      class={cn(
        "content-grid w-full text-bg [&_a]:text-bg [&_a]:underline [&_a]:hover:text-text",
        {
          "bg-error": props.level === "error",
          "bg-sub": props.level === "notice",
          "bg-main": props.level === "success",
        },
      )}
    >
      <div class="flex w-full justify-between gap-2">
        <Show
          when={props.imagePath !== undefined}
          fallback={<i class={`self-center ${icon()}`}></i>}
        >
          <img
            src={props.imagePath}
            alt="Banner Image"
            class="hidden aspect-6/1 h-full max-h-9 self-center xl:block"
          />
          <i class={`self-center ${icon()} xl:hidden`}></i>
        </Show>
        <div class="self-center p-2">{props.customContent ?? props.text}</div>
        <Show
          when={props.important === true}
          fallback={
            <button
              type="button"
              class="text -mr-2 self-center text-bg hover:text-text"
              onClick={() => {
                remove();
              }}
            >
              <Fa icon="fa-times" fixedWidth />
            </button>
          }
        >
          <i class={`self-center ${icon()}`}></i>
        </Show>
      </div>
    </div>
  );
}

export function Banners(): JSXElement {
  const [ref, element] = useRefWithUtils();

  let nameChangeAdded = false;
  createEffectOn(
    () => getSnapshot()?.needsToChangeName,
    (needsToChange) => {
      if (needsToChange && !nameChangeAdded) {
        nameChangeAdded = true;
        addBanner({
          level: "error",
          icon: "fas fa-exclamation-triangle",
          customContent: (
            <>
              You need to update your account name.{" "}
              <button
                type="button"
                class="px-2 py-1"
                onClick={() => {
                  showPopup("updateName");
                }}
              >
                Click here
              </button>{" "}
              to change it and learn more about why.
            </>
          ),
          important: true,
        });
      }
    },
  );

  const setGlobalOffsetSignal = (): void => {
    const height = element()?.getOffsetHeight() ?? 0;
    setGlobalOffsetTop(height);
  };

  const debouncedMarginUpdate = debounce(100, setGlobalOffsetSignal);

  onMount(() => {
    window.addEventListener("resize", debouncedMarginUpdate);
  });

  onCleanup(() => {
    window.removeEventListener("resize", debouncedMarginUpdate);
  });

  createEffectOn(() => getBanners().length, setGlobalOffsetSignal);

  return (
    <div ref={ref} class="fixed top-0 left-0 z-1000 w-full">
      <For each={getBanners()}>{(banner) => <Banner {...banner} />}</For>
    </div>
  );
}
