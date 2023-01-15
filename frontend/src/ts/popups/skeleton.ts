const parent = document.getElementById("popups") as HTMLElement;
const skeletons = new Map<string, HTMLElement>();

export function save(id: string, removeAfter = true): void {
  const el = document.getElementById(id) as HTMLElement;
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

export function append(id: string, parentOverride = ""): void {
  const popup = skeletons.get(id) as HTMLElement;
  if (parentOverride) {
    (<HTMLElement>document.getElementById(parentOverride)).append(popup);
  } else {
    parent.append(popup);
  }
}
