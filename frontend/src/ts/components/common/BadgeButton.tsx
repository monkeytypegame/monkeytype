import { badges, UserBadge } from "../../controllers/badge-controller";

export function BadgeButton(props: {
  id: number;
  selected: boolean;
  onClick: () => void;
}) {
  const badge = (): UserBadge | undefined =>
    props.id !== -1 ? badges[props.id] : undefined;

  return (
    <button
      type="button"
      class="mr-2 mb-2 w-max cursor-pointer rounded-half p-0"
      classList={{
        "opacity-100": props.selected,
        "opacity-25 hover:opacity-100": !props.selected,
      }}
      onClick={() => props.onClick()}
    >
      <div
        class="badge"
        style={
          badge()
            ? {
                background: badge()?.background,
                color: badge()?.color,
                ...badge()?.customStyle,
              }
            : undefined
        }
      >
        <i class={`fas ${badge()?.icon ?? "fa-frown-open"}`}></i>
        <div class="text">{badge()?.name ?? "none"}</div>
      </div>
    </button>
  );
}
