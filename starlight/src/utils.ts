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

export function indent(lines: string, indent: string = "  ") {
  return lines
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

export function isString(x: any): x is string {
  return typeof x === "string";
}

export function vomit(x: any) {
  if (isString(x)) {
    return x;
  }

  return JSON.stringify(sort(x));
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
    console.log(ch ? ch(x) : x);
    return x;
  };
}

export type MaybePromise<T> = T | Promise<T>;
