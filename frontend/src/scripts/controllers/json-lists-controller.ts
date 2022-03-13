import { getJSON } from "../utils/misc";

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
