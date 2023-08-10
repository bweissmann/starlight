import { query } from '../../llm/utils.js';
import { system, user } from '../../utils.js';
import { respondInJSONFormat } from '../utils.js';

const determine_programming_language = (draft: string) => query<ProgrammingLanguage>({
    name: "Determining Programming Language",
    jsonSpec: ` 
    {
        "language":  "python" | "javascript" | "typescript" | "c#" | "bash" | "other" | "mixture"
    }`,
    messages: (jsonSpec) => [
        system(
            `What programming language is this code written in? 
            If there is only one programming language present, respond with the name of that programming language.
            The programming langauge names you can respond with are "python", "c#", "javascript", "typescript", "bash" or "other" 

            If there are multiple programming languages in the code, respond with "mixture".
            Even if one programming language is used much more than the others, respond with "mixture".

            ${respondInJSONFormat(jsonSpec)}`
        ),
        user(draft),
    ]
})

type ProgrammingLanguage = {
    language: "python" | "javascript" | "typescript" | "c#" | "bash" | "other" | "mixture"
};

export default determine_programming_language;