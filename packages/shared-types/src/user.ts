import { Difficulty } from "./config";
import { StringNumber } from "./util";

export type PersonalBest = {
  acc: number;
  consistency?: number;
  difficulty: Difficulty;
  lazyMode?: boolean;
  language: string;
  punctuation?: boolean;
  numbers?: boolean;
  raw: number;
  wpm: number;
  timestamp: number;
};

export type PersonalBests = {
  time: Record<StringNumber, PersonalBest[]>;
  words: Record<StringNumber, PersonalBest[]>;
  quote: Record<StringNumber, PersonalBest[]>;
  custom: Partial<Record<"custom", PersonalBest[]>>;
  zen: Partial<Record<"zen", PersonalBest[]>>;
};
