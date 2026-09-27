import type { Suggestion } from "@textoic/enlint/types";

export type Finding = {
  id: string;
  start: number;
  end: number;
  message: string;
  suggestions?: Suggestion[];
};

export type Scope = "words" | "sentences" | "shape";
