import { chat } from "@/llm/chat";
import { maybeExtractSingleFencedSnippet } from "@/llm/parser/code-fence";
import { ChatSpec, assistant, g35_t02 } from "@/llm/utils";
import { MaybePromise } from "@/utils.js";
import { Atom, DecisionNode, Forward, Node, ToString } from "./graph.js";
import { node__executeShell } from "./steps/execute-shell.js";

export function node<In extends ToString, Out extends ToString>(
  forward: Forward<In, Out>
) {
  return new Atom(forward).node;
}

export function node__chat<In extends ToString>(
  messages_producer: (from: In) => MaybePromise<ChatSpec>
): Node<In, string> {
  return new Atom<In, string>(
    async (from, env) => {
      const messages = await messages_producer(from);
      return (await chat(env.tx, messages)).message;
    },
    { description: "chat" }
  ).node;
}

export function atom__parseJson<T extends ToString>(): Atom<string, T> {
  return new Atom((from) => JSON.parse(maybeExtractSingleFencedSnippet(from)), {
    description: "parseJson",
  });
}

export function node__format<Out extends ToString>(
  copypastetypescript: string
): Node<string, Out> {
  return node__chat((input: string) =>
    g35_t02(
      assistant(input),
      `reformat your respond as JSON following this schema:\n\n${copypastetypescript}. Put your json within a code blck \`\`\`json\n<content>\n\`\`\``
    )
  ).pipe(atom__parseJson<Out>());
}

export function node__exec<
  In extends { args: string; c_template: string },
>(): Node<In, string> {
  return new DecisionNode(
    { "execute-shell": node__executeShell },
    async ({ c_template, args }: In) => {
      return { choice: c_template, args };
    }
  );
}
