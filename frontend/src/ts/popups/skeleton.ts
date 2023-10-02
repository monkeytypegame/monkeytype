const parent = document.getElementById("popups") as HTMLElement;
const skeletons = new Map<string, HTMLElement>();

export function save(id: string, removeAfter = true): void {
  const el = document.getElementById(id) as HTMLElement;
  if (!el) throw new Error(`Element with id ${id} not found`);
  skeletons.set(id, el);
  if (removeAfter) remove(id);
}

export function remove(id: string): void {
  const popup = skeletons.get(id);
  if (popup) {
    popup.remove();
  } else {
    save(id, true);
  }
}

type ParentOverride = "main";

export function append(id: string, parentOverride?: ParentOverride): void {
  const popup = skeletons.get(id) as HTMLElement;
  if (parentOverride) {
    (<HTMLElement>document.querySelector(parentOverride)).append(popup);
  } else {
    parent.append(popup);
  }
}
