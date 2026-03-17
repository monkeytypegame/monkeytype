import { JSXElement } from "solid-js";
import { createStore } from "solid-js/store";

export type Banner = {
  id: number;
  level: "error" | "notice" | "success";
  icon?: string;
  imagePath?: string;
  important?: boolean;
  onClose?: () => void;
} & (
  | {
      text: string;
      customContent?: undefined;
    }
  | {
      customContent: JSXElement;
      text?: undefined;
    }
);

let id = 0;
const [banners, setBanners] = createStore<Banner[]>([]);

export function addBanner(banner: Omit<Banner, "id">): number {
  const newid = id++;
  setBanners((prev) => [...prev, { ...banner, id: newid } as Banner]);
  return newid;
}

export function removeBanner(bannerId: number): void {
  const banner = getBanner(bannerId);
  banner?.onClose?.();
  setBanners((prev) => prev.filter((banner) => banner.id !== bannerId));
}

export function getBanner(bannerId: number): Banner | undefined {
  return banners.find((banner) => banner.id === bannerId);
}

export function getBanners(): Banner[] {
  return banners;
}
