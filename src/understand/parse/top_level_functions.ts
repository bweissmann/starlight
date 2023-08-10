import { respondInJSONFormat } from "../../implement/utils.js";
import { query } from "../../llm/utils.js";
import { system, user } from "../../utils.js";

export default function parse_top_level_functions(fileContents: string) {
  return query<ExtractedFunctionDeclarations>({
    name: "Parse Top Level Functions From File",
    jsonSpec: `{
      "type": "object",
      "properties": {
        "functions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "jsDoc": {
                "type": "string",
                "description": "If there is a JSDoc string for the function, copy that string here. Include the /** and */. Otherwise, leave this field blank."
              },
              "declaration": {
                "type": "string",
                "description": "The full declaration of the function, not including the implementation body"
              },
              "description": {
                "type": "string",
                "description": "A description of what the function does. Prefer an explanation of the function's purpose over a description of its implementation."
              },
              "usage": {
                "type": "string",
                "description": "A one-liner example invocation of the function. A comment at the end of the line shows the output of the function call"
              },
              "lineStart": {
                "type": "number"
              },
              "lineEnd": {
                "type": "number"
              }
            },
            "required": ["declaration", "description", "usage", "lineStart", "lineEnd"]
          }
        }
      },
      "required": ["functions"]
    }`,

    messages: (jsonSpec) => [
      system(`
        You will be given the source code of a file. Please parse only the top-level functions from this file.
        
        Read the source code of the function carefully to determine what it accomplishes. The description should be precise.

        ${respondInJSONFormat(jsonSpec)}
      `),
      user(fileContents)
    ]
  })
}

type ExtractedFunctionDeclarations = {
  functions: {
    jsDoc: string, // If there is a JSDoc string for the function, copy that string here. Inlcude the /** and */. Otherwise, leave this field blank.
    declaration: string, // The full declaration of the function, not including the implementation body
    description: string, // A description of what the function does. Prefer an explanation of the function's purpose over a description of its implementation.
    usage: string, // A one-liner example invocation of the function. A comment at the end of the line shows the output of the function call
    lineStart: number,
    lineEnd: number,
  }[]
}