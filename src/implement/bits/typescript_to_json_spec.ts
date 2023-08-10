import { execute } from "../../llm/chat.js";
import { unstructured } from "../../llm/utils.js";
import { system, user } from "../../utils.js";

export default function typescript_to_json_spec(typescipt_type: string) {
    return unstructured({
        name: "Typescript to JSON Spec",
        messages: [
            system(`
            Write the equivalent JSON Object Specification for this typescript type.
            Any code comments in the Typescript declarations should be converted to description fields in the JSON Spec.
            `),
            user(typescipt_type)
        ]
    })
}

export function execute_to_json_spec(t: string) {
    return execute(typescript_to_json_spec(t))
}