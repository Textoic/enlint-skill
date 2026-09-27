import type { Suggestion } from "english-lint/types";

export type Finding = {
  id: string;
  start: number;
  end: number;
  message: string;
  suggestions?: Suggestion[];
};

export type Scope = "words" | "sentences" | "shape";
