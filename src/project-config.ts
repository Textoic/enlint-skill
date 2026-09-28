import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Config, IgnoredCases } from "@textoic/enlint/types";

type RuleOptions = { ignore?: unknown };
type RuleSetting = string | [string, RuleOptions?];
export type ProjectConfig = { rules?: Record<string, RuleSetting> };

export const configFileNames = ["textoic.config.json", ".textoicrc.json"];

const configIn = (directory: string) =>
  configFileNames
    .map((name) => join(directory, name))
    .find((path) => existsSync(path));

export const findConfigFile = (from: string): string | undefined => {
  const found = configIn(from);
  const parent = dirname(from);
  return found != null || parent === from
    ? found
    : findConfigFile(parent);
};

const readConfig = (path: string): ProjectConfig | undefined => {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ProjectConfig;
  } catch {
    return undefined;
  }
};

export const projectConfigFrom = (
  directory: string,
): ProjectConfig | undefined => {
  const path = findConfigFile(directory);
  return path == null ? undefined : readConfig(path);
};

const severityOf = (setting: RuleSetting) =>
  Array.isArray(setting) ? setting[0] : setting;

const ignoredIn = (setting: RuleSetting): string[] => {
  const ignore = Array.isArray(setting) ? setting[1]?.ignore : undefined;
  return Array.isArray(ignore)
    ? ignore.filter((key): key is string => typeof key === "string")
    : [];
};

const switchedOff = (rules: Record<string, RuleSetting>) =>
  Object.entries(rules)
    .filter(([, setting]) => severityOf(setting) === "off")
    .map(([rule]) => [rule, false]);

const ignoredCases = (rules: Record<string, RuleSetting>): IgnoredCases =>
  Object.fromEntries(
    Object.entries(rules)
      .map(([rule, setting]) => [rule, ignoredIn(setting)] as const)
      .filter(([, keys]) => keys.length > 0),
  );

export const withProjectConfig = (
  base: Config,
  project: ProjectConfig | undefined,
): Config => {
  const rules = project?.rules ?? {};
  return {
    ...base,
    ...(Object.fromEntries(switchedOff(rules)) as Config),
    ignore: { ...base.ignore, ...ignoredCases(rules) },
  };
};
