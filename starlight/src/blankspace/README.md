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

# details

- specs must be static strings - they cannot have dynamic interpolation. Any dynamic data should be put in run(...) not build(...)
> *NOTE* I've also been experimenting with generating placeholder strings in the system prompt that are replaced at runtime with inputs. If this route turns out to be more natural, then inputs will also have static typescript annotations for the expected fields.

- prompts are cached by their spec string, so if you change the spec at all, even just a whitespace change, you'll need to recompile the prompt

# future directions

the interesting part of blankspace to me is the automatic typescript & output parsing inference from the prompt.

I think of the actual "prompt generation from a spec" step as a bit of a black box which can be optimized ad nauseum without affecting the structure of blankspace. my prompts ive been using so far are very naive (see `blankspace/generators/*.ts`)

another direction is generation speed. i'm planning to change the order of my gpt calls so that the output type is ready first and written to disk so the user gets immediate feedback without us needing the full prompt to be ready yet.