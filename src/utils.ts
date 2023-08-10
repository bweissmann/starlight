import { ChalkInstance } from "chalk";
import { Message } from "./llm/utils.js";

function sort<T extends object | any[]>(x: T): T {
  if (typeof x === 'undefined' || x === null) {
    return x;
  }

  if (Array.isArray(x)) {
    return x.map((v => sort(v))) as T;
  }

  if (typeof x === 'object') {
    return Object.keys(x).sort().reduce((acc, k) => { acc[k] = sort((x as any)[k]); return acc }, {} as any);
  }

  return x;
}

export function vomit(x: any) {
  return JSON.stringify(sort(x));
}


export function system(content: string): Message {
  return { role: 'system', content }
}

export function user(content: string): Message {
  return { role: 'user', content }
}

export function assistant(content: string): Message {
  return { role: 'assistant', content }
}

export function cast<T>(x: any): T {
  return x as T;
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function logger(): <T>(x: T) => T;
export function logger(ch: ChalkInstance): <T>(x: T) => T;
export function logger(ch?: ChalkInstance): <T>(x: T) => T {
  return (x) => {
    console.log(ch ? ch(x) : x);
    return x;
  }

}