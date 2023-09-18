# blankspace

Blankspace is a system that compiles natural language prompt specs into: 
- a GPT-4 system prompt
- an output parser for that prompt
- the typescript annotation of its output.

# usage

the syntax is:
`const result = await blankspace.build(spec: string).run(messages: string[])`

where
- `spec` is your natural language prompt description
- `messages` is a list of dynamic user messages


Once you generate the blankspace prompt, your blankspace.build(...) call will be type-annotated with the filename that contains the generated prompt and output parsing code. You can manually inspect the raw prompt and refine your spec as needed.

E.g.
```
(method) blankspace.build<"fix-error-message_v3.ts", "The user will give you an error message and you'll...
```

# example

Your source code just defines the spec:
```
const errorMessage = "...";
const action = await blankspace
  .build(
    `The user will give you an error message and you'll write the action you will take to fix it. 
  The receiver of your action won't have access to the original error unless you give it to them.

  Your action will have this JSON format:
  {
    file: string, // the file to open
    instructions: string // the instructions to the code editing agent
  }`
  )
  .run([errorMessage]);
```
Then our return type is statically typed:
```
const action: {
    file: string;
    instructions: string;
}
``` 
And we can inspect the raw prompt becuase the filename is a generic type argument of build
```
(method) blankspace.build<"fix-error-message_v3.ts", "The user will give you an error message and you'll...
```
And when we go to that file, we can see that it's using a JSON output parser:
```
async function parse(raw: string): Promise<Prompt["inferred"]["returns"]> {
  return asJSON<{ file: string; instructions: string }>(raw);
}
```


# details

- specs must be static strings - they cannot have dynamic interpolation. Any dynamic data should be put in run(...) not build(...)
  > **note:** I've also been experimenting with generating placeholder strings in the system prompt that are replaced at runtime with inputs. If this route turns out to be more natural, then inputs will also have static typescript annotations for the expected fields.

- prompts are cached by their spec string, so if you change the spec at all, even just a whitespace change, you'll need to recompile the prompt

# future directions

the interesting part of blankspace to me is the automatic typescript & output parsing inference from the prompt.

I think of the actual "prompt generation from a spec" step as a bit of a black box which can be optimized ad nauseum without affecting the structure of blankspace. my prompts ive been using so far are very naive (see `blankspace/generators/*.ts`)

another direction is generation speed. i'm planning to change the order of my gpt calls so that the output type is ready first and written to disk so the user gets immediate feedback without us needing the full prompt to be ready yet.