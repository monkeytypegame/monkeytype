import { getInputElementValue } from "../input/input-element";

class Input {
  current: string;
  // private history: string[];
  koreanStatus: boolean;
  constructor() {
    this.current = "";
    // this.history = [];
    this.koreanStatus = false;
  }

  reset(): void {
    this.current = "";
    // this.history = [];
  }

  setKoreanStatus(val: boolean): void {
    this.koreanStatus = val;
  }

  getKoreanStatus(): boolean {
    return this.koreanStatus;
  }

  syncWithInputElement(): void {
    this.current = getInputElementValue().inputValue;
  }
}

export const input = new Input();
