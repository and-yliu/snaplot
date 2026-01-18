/**
 * Recap Service for IRL Quests
 *
 * Generates the final story recap from gameplay results.
 */
import { chatWithSchema } from "./llm.service";
import { RECAP_SYSTEM_PROMPT, RECAP_SCHEMA } from "../lib/prompts/recap.prompt";
// ============================================================================
// Model Configuration
// ============================================================================
const RECAP_MODEL = "google/gemini-3-flash-preview";
// ============================================================================
// Recap Functions
// ============================================================================
/**
 * Generate the final story recap from gameplay results
 */
export async function generateRecap(input) {
    const { story, trollName, results } = input;
    // Build the context for the LLM
    const resultsText = results
        .sort((a, b) => a.index - b.index)
        .map((r) => `[${r.index}] "${r.bestWord}"`)
        .join("\n");
    return chatWithSchema(RECAP_MODEL, [
        { role: "system", content: RECAP_SYSTEM_PROMPT },
        {
            role: "user",
            content: `**STORY TEMPLATE:**
${story}

**TROLL NAME (replace protagonist with this):** ${trollName}

**SUBMISSIONS FOR EACH BLANK:**
${resultsText}

Generate the epic final recap with ${trollName} as the protagonist!`,
        },
    ], { name: "recap_result", strict: true, schema: RECAP_SCHEMA });
}
//# sourceMappingURL=recap.service.js.map