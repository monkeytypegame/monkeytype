const compositionState = {
  composing: false,
  startPos: -1,
  data: "",
};

export function getComposing(): boolean {
  return compositionState.composing;
}

// export function getStartPos(): number {
//   return compositionState.startPos;
// }

export function setComposing(isComposing: boolean): void {
  compositionState.composing = isComposing;
}

// export function setStartPos(pos: number): void {
//   compositionState.startPos = pos;
// }

export function setData(data: string): void {
  compositionState.data = data;
}

export function getData(): string {
  return compositionState.data;
}
