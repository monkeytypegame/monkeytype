import { createStore } from "solid-js/store";

export type AlertPsa = {
  message: string;
  level: number;
};

const [psas, setPsas] = createStore<AlertPsa[]>([]);

export function addPsa(message: string, level: number): void {
  setPsas((prev) => [...prev, { message, level }]);
}

export function getPsas(): AlertPsa[] {
  return psas;
}
