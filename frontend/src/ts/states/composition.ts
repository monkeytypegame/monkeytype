interface CompositionState {
  composing: boolean;
  startPos: number;
}

const compositionState = {
  composing: false,
  startPos: -1,
};

export function get(): CompositionState {
  return compositionState;
}

export function getComposing(): boolean {
  return compositionState.composing;
}

export function getStartPos(): number {
  return compositionState.startPos;
}

export function setComposing(isComposing: boolean): void {
  compositionState.composing = isComposing;
}

export function setStartPos(pos: number): void {
  compositionState.startPos = pos;
}
