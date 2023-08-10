import { query } from "../../llm/utils.js";
import { system, user } from "../../utils.js";
import { baseRole, respondInJSONFormat } from "../utils.js";

export default function parse_draft_into_snippets(unstructured_draft: string) {
    return query<Snippets>({
        name: "Parse Draft Into Snippets",
        jsonSpec: `
    {
        "type": "object",
        "properties": {
            "snippets": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "programmingLanguage": {
                            "type": "string"
                        },
                        "code": {
                            "type": "string"
                        },
                        "description": {
                            "type": "string"
                        }
                    },
                    "required": ["programmingLanguage", "code", "description"]
                }
            }
        },
        "required": ["snippets"]
    }
    `,
        messages: (jsonSpec) => [
            system(
                `
            ${baseRole}

            The user has given you instructions for how to complete a programming task.
            These instructions contain a mixture of plain text and code snippets.

            It is your job to parse this into a structured format, so that each snippet of code can be understood separately.

            If a code snippet contains a function definition and also an example of how to call that function, parse those as two separate code snippets.

            ${respondInJSONFormat(jsonSpec)}
            `
            ),
            user(unstructured_draft)
        ]
    })
}

type Snippets = {
    snippets: {
        programmingLanguage: string,
        code: string,
        description: string,
    }[]
}