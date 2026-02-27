import { For, JSXElement, onCleanup, onMount } from "solid-js";
import { debounce } from "throttle-debounce";

import { createEffectOn } from "../../../hooks/effects";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { setGlobalOffsetTop } from "../../../signals/core";
import {
  Banner as BannerType,
  getBanners,
  removeBanner,
} from "../../../stores/banners";
import { cn } from "../../../utils/cn";
import { Conditional } from "../../common/Conditional";
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
        <Conditional
          if={props.imagePath !== undefined}
          then={
            <>
              <img
                src={props.imagePath}
                alt="Banner Image"
                class="hidden aspect-6/1 h-full max-h-9 self-center xl:block"
              />
              <i class={`self-center ${icon()} xl:hidden`}></i>
            </>
          }
          else={<i class={`self-center ${icon()}`}></i>}
        />
        <Conditional
          if={props.customContent !== undefined}
          then={<div class="self-center p-2">{props.customContent}</div>}
          else={<div class="self-center p-2">{props.text}</div>}
        />
        <Conditional
          if={props.important === true}
          then={<i class={`self-center ${icon()}`}></i>}
          else={
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
        />
      </div>
    </div>
  );
}

export function Banners(): JSXElement {
  const [ref, element] = useRefWithUtils();

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
