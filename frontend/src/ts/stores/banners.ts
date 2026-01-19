import { createStore } from "solid-js/store";

export type Banner = {
  id: number;
  level: -1 | 0 | 1;
  icon?: string;
  imagePath?: string;
  text: string;
  important?: boolean;
  allowHtml?: boolean;
  onClose?: () => void;
};

let id = 0;
const [banners, setBanners] = createStore<Banner[]>([]);

export function addBanner(banner: Omit<Banner, "id">): number {
  const newid = id++;
  setBanners((prev) => [...prev, { ...banner, id: newid }]);
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
