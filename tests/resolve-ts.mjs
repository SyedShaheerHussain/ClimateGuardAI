import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RELATIVE = /^\.{1,2}\//;

export async function resolve(specifier, context, nextResolve) {
  if (RELATIVE.test(specifier) && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    for (const suffix of [".ts", ".tsx", ".js", "/index.ts"]) {
      const candidate = new URL(specifier + suffix, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(candidate.href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
