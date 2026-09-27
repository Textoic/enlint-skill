import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import nlp, {
  type Dictionary,
  type FeatureWeights,
  type LexicalProps,
  type ParsedToken,
} from "@textoic/artisan";

const located = (name: string) => {
  const bundled = fileURLToPath(new URL(`./data/${name}`, import.meta.url));
  return existsSync(bundled)
    ? bundled
    : fileURLToPath(import.meta.resolve(`@textoic/artisan/${name}`));
};

const load = async <T>(name: string): Promise<T> =>
  JSON.parse(await readFile(located(name), "utf8")) as T;

const dictionary: Dictionary = new Map(
  await load<[string, LexicalProps][]>("dictionary.json"),
);
const weights = await load<FeatureWeights>("weights.json");

export default (text: string): ParsedToken[][] =>
  nlp(text, { dictionary, weights });
