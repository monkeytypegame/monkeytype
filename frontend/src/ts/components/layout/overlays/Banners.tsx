import {
  createEffect,
  For,
  JSXElement,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { debounce } from "throttle-debounce";

import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { setGlobalOffsetTop } from "../../../signals/core";
import {
  Banner as BannerType,
  getBanners,
  removeBanner,
} from "../../../stores/banners";
import { cn } from "../../../utils/cn";
import { Conditional } from "../../common/Conditional";

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
        "content-grid text-bg [&_a]:text-bg [&_a]:hover:text-text w-full [&_a]:underline",
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
              class="text text-bg hover:text-text -mr-2 self-center"
              onClick={() => {
                remove();
              }}
            >
              <i class="fas fa-fw fa-times"></i>
            </button>
          }
        />
      </div>
    </div>
  );
}

export function Banners(): JSXElement {
  const [ref, element] = useRefWithUtils();

  const updateMargin = (): void => {
    const height = element()?.getOffsetHeight() ?? 0;
    setGlobalOffsetTop(height);
  };

  const debouncedMarginUpdate = debounce(100, updateMargin);

  onMount(() => {
    window.addEventListener("resize", debouncedMarginUpdate);
  });

  onCleanup(() => {
    window.removeEventListener("resize", debouncedMarginUpdate);
  });

  createEffect(on(() => getBanners().length, updateMargin));

  return (
    <div ref={ref} class="fixed top-0 left-0 z-[1000] w-full">
      <For each={getBanners()}>{(banner) => <Banner {...banner} />}</For>
    </div>
  );
}
