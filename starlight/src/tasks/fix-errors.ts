import { codePlanner } from "@/agents/code-planner";
import blankspace from "@/blankspace/blankspace";
import { getFilepath } from "@/fs/get-filepath";
import { readOrEmptyString } from "@/fs/read";
import { node__chat, node__exec, node__format } from "@/graph/nodes";
import { g35_t02, g4_t04, system_dedent as sysd } from "@/llm/utils";
import { Cx, Tx, defaultTx } from "@/project/context";
import { loadBuildSystemContext } from "@/project/loaders";

export default async function TASk_fixErrors(cx: Cx) {
  // const stdout = () => safely(executeCommand, tx, `npm run build`);

  // const errors = (stdout: string) =>
  //   blankspace
  //     .build(
  //       `
  //   Take this stdout/stderr output and extract each of the actionable errors so we have them in a list.
  //   some of the ouput is errors and some is normal stdout
  //   `
  //     )
  //     .with(tx)
  //     .run([stdout]);

  const gen_and_exec_subgraph = node__chat(async (task: string) =>
    g35_t02(
      sysd`<context>
    ${await readOrEmptyString("./examples/codegen/run.md")}
      </context>`,
      task
    )
  )
    .pipe(
      node__format<{ c_template: "execute-shell" | "pass"; args: string }>(
        `{ c_template: "execute-shell" | "pass"; args: string }`
      )
    )
    .pipe(node__exec());

  gen_and_exec_subgraph.print_debug();
  const result = await gen_and_exec_subgraph
    .pipe(node__chat((output) => g4_t04("here's what happened", output)))
    .run("npx tsc", {
      tx: defaultTx(cx.projectDirectory),
    });
  console.log(result);
  // const graph = origin
  //   .exec(() => "run npx tsc")
  //   .then(
  //     "pull out the errors in a list, each error in a code-fence ```<content>```"
  //   )
  //   .pipe(extractFencedSnippets, "extractFencedSnippets")
  //   .map((producer) => producer.pipe((s) => "HERE I AM " + s));
  //   .toplevel__split()
  //   .toplevel__map((error: string) => ({ tx, error }))
  //   .toplevel__map(fixError);

  // define<string[]>("fix project errors").as(
  //   origin
  //     .then("run `npm run build`")
  //     .then<string[]>("split errors into a list")
  //     .map((producer) =>
  //       producer.pipe((error) => ({ tx, error })).pipe(fixError)
  //     )
  // );

  // const graph = origin()
  //   .then("run `pnpm run tsc`")
  //   .then("split errors into a list")
  //   // .map((producer) => producer.then(""));

  // graph.print_debug();
  // const result = await graph.with().run();
  // console.log(result);
}

async function fixError(args: { tx: Tx; error: string }) {
  const { tx, error } = args;

  const action = await blankspace
    .build(
      `The user will give you an error message. you'll give instructions to a programmer on how to fix it.
   output this format:
  {
    file: string, // the file to open
    instructions: string // the instructions to the programmer
  }`
    )
    .with(tx)
    .run({
      Context: await loadBuildSystemContext(tx.cx),
      Error: error,
    });

  await codePlanner(
    tx,
    await getFilepath(tx, action.file),
    action.instructions
  );

  return "TODO: return something";
}
