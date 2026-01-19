import {
  createEffect,
  For,
  JSXElement,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import {
  Banner as BannerType,
  getBanners,
  removeBanner,
} from "../../../stores/banners";
import { cn } from "../../../utils/cn";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { qsr } from "../../../utils/dom";
import { convertRemToPixels } from "../../../utils/numbers";
import { debounce } from "throttle-debounce";
import { Conditional } from "../../common/Conditional";

function Banner(props: BannerType): JSXElement {
  const remove = (): void => {
    // document.startViewTransition(() => {
    removeBanner(props.id);
    // });
  };
  const icon =
    props.icon === undefined || props.icon === ""
      ? "fa fa-fw fa-bullhorn"
      : props.icon;

  return (
    <div
      class={cn("content-grid w-full text-bg", {
        "bg-error": props.level === -1,
        "bg-sub": props.level === 0,
        "bg-main": props.level === 1,
      })}
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
              <i class={`self-center ${icon} xl:hidden`}></i>
            </>
          }
          else={<i class={`self-center ${icon}`}></i>}
        />
        <Conditional
          if={props.allowHtml === true}
          then={<div class="self-center p-2" innerHTML={props.text}></div>}
          else={<div class="self-center p-2">{props.text}</div>}
        />
        <Conditional
          if={props.important === true}
          then={<i class={`self-center ${icon}`}></i>}
          else={
            <button
              type="button"
              class="text -mr-2 self-center text-bg hover:text-text"
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
    const offset = height + convertRemToPixels(2);
    qsr("#app").setStyle({
      paddingTop: offset + "px",
    });
    qsr("#notificationCenter").setStyle({
      marginTop: offset + "px",
    });
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
    <div ref={ref} class="fixed top-0 left-0 z-10 w-full">
      <For each={getBanners()}>{(banner) => <Banner {...banner} />}</For>
    </div>
  );
}
