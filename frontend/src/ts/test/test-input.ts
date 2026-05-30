import { getInputElementValue } from "../input/input-element";

class Input {
  current: string;
  // private history: string[];
  constructor() {
    this.current = "";
    // this.history = [];
  }

  reset(): void {
    this.current = "";
    // this.history = [];
  }

  syncWithInputElement(): void {
    this.current = getInputElementValue().inputValue;
  }
}

export const input = new Input();
