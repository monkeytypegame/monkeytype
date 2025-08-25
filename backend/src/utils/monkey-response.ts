import { MonkeyResponseType } from "@aitype/contracts/util/api";

export type MonkeyDataAware<T> = {
  data: T | null;
};

export class MonkeyResponse<T = null>
  implements MonkeyResponseType, MonkeyDataAware<T>
{
  public message: string;
  public data: T;

  constructor(message: string, data: T) {
    this.message = message;
    this.data = data;
  }
}
