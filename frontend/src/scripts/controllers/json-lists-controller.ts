import { getJSON } from "../utils/misc";
import { hexToHSL } from "../utils/misc";

const layoutsListPromise = getJSON(
  "layouts/_list.json"
) as Promise<MonkeyTypes.Layouts>;

export async function getLayouts(): Promise<MonkeyTypes.Layouts> {
  return await layoutsListPromise;
}

export async function getLayout(
  layoutName: string
): Promise<MonkeyTypes.Layout> {
  return (await layoutsListPromise)[layoutName];
}

type Theme = { name: string; bgColor: string; mainColor: string };
const themesPromise = getJSON("themes/_list.json") as Promise<Theme[]>;

export async function getThemes(): Promise<Theme[]> {
  return (await themesPromise).sort(function (a: Theme, b: Theme) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
}

export async function getSortedThemes(): Promise<Theme[]> {
  return (await themesPromise).sort((a, b) => {
    const b1 = hexToHSL(a.bgColor);
    const b2 = hexToHSL(b.bgColor);
    return b2.lgt - b1.lgt;
  });
}
