import { ChalkInstance } from "chalk";

function sort<T extends object | any[]>(x: T): T {
  if (typeof x === "undefined" || x === null) {
    return x;
  }

  if (Array.isArray(x)) {
    return x.map((v) => sort(v)) as T;
  }

  if (typeof x === "object") {
    return Object.keys(x)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sort((x as any)[k]);
        return acc;
      }, {} as any);
  }

  return x;
}

export async function safely<R, A extends any[]>(
  fn: (...args: A) => R,
  ...args: A
) {
  try {
    return await fn(...args);
  } catch (e: any) {
    return e.toString() as string;
  }
}

export function indent(lines: string, indent: string = "  ") {
  return lines
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

export function makeSafeFromBackticks(input: string) {
  return input.replace(/(?<!\\)`/g, "\\`");
}

export function isString(x: any): x is string {
  return typeof x === "string";
}

export function vomit(x: any, clean: boolean = false) {
  if (isString(x)) {
    return x;
  }

  return clean ? JSON.stringify(sort(x), null, 2) : JSON.stringify(sort(x));
}

export function cast<T>(x: any): T {
  return x as T;
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function logger(): <T>(x: T) => T;
export function logger(ch: ChalkInstance): <T>(x: T) => T;
export function logger(ch?: ChalkInstance): <T>(x: T) => T {
  return (x) => {
    const stringified = vomit(x, true);
    console.log(ch ? ch(stringified) : stringified);
    return x;
  };
}

export type MaybePromise<T> = T | Promise<T>;
