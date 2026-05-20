const compositionState = {
  composing: false,
  data: "",
};

export function getComposing(): boolean {
  return compositionState.composing;
}

export function setComposing(isComposing: boolean): void {
  compositionState.composing = isComposing;
}

export function setData(data: string): void {
  compositionState.data = data;
}

export function getData(): string {
  return compositionState.data;
}
