export let isRepeated = false;
export let isPaceRepeat = false;
export let isActive = false;
export let activeChallenge: null | MonkeyTypes.Challenge = null;
export let savingEnabled = true;
export let bailedOut = false;

export function setRepeated(tf: boolean): void {
  isRepeated = tf;
}

export function setPaceRepeat(tf: boolean): void {
  isPaceRepeat = tf;
}

export function setActive(tf: boolean): void {
  isActive = tf;
}

export function setActiveChallenge(val: null | MonkeyTypes.Challenge): void {
  activeChallenge = val;
}

export function setSaving(val: boolean): void {
  savingEnabled = val;
}

export function setBailedOut(tf: boolean): void {
  bailedOut = tf;
}
