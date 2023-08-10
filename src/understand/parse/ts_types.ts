import { respondInJSONFormat } from "../../implement/utils.js";
import { query } from "../../llm/utils.js";
import { system, user } from "../../utils.js";

export default function parse_ts_types_from_file(fileContents: string) {
    return query<ExtractedTSTypes>({
        name: "Parse TS Types",
        jsonSpec: `{
            "type": "object",
            "properties": {
                "types": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "code": {
                                "type": "string",
                                "description": "The full source code of the TS type definition. Might span multiple lines."
                            },
                            "lineStart": {
                                "type": "number",
                                "description": "The line number where the type definition starts."
                            },
                            "lineEnd": {
                                "type": "number",
                                "description": "The line number where the type definition ends."
                            }
                        },
                        "required": ["code", "lineStart", "lineEnd"]
                    }
                }
            },
            "required": ["types"]
        }`,
        messages: (jsonSpec) => [
            system(`
            You will be given the source code of a file. 
            Please parse only the top-level Typescript type definition from this file. 
            Parse Each TS Type definition as a separate entry in the "types" array. 
            Do not include any functions, variables, or other code in the "types" array.
            Only parse the top-level types, not types that are nested inside of other types.
            You can determine the start of a type definition by looking for the "type" keyword.
            ${respondInJSONFormat(jsonSpec)}
            `),
            user(fileContents)
        ]
    })
}
type ExtractedTSTypes = {
    types: {
        code: string, // The full source code of the TS type definition. Might span multiple lines.
        lineStart: number,
        lineEnd: number,
    }[]
}
