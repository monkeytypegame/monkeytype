import seedrandom from "seedrandom";

let rng = seedrandom(Date.now().toString());

export function setSeed(seed: string): void {
  console.log("Setting seed to", seed);
  rng = seedrandom(seed);
  console.log(rng());
}

export function get(): number {
  return rng();
}
