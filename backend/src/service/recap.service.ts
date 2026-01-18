/**
 * Recap Service for IRL Quests
 *
 * Generates the final story recap from gameplay results.
 */

import { chatWithSchema } from "./llm.service";
import { RECAP_SYSTEM_PROMPT, RECAP_SCHEMA } from "../lib/prompts/recap.prompt";

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Result for a single blank */
export interface BlankResult {
    index: number;
    bestWord: string;
}

/** Input for recap generation */
export interface RecapServiceInput {
    story: string;
    trollName: string;
    results: BlankResult[];
}

/** A single story segment leading to an item */
export interface StorySegment {
    index: number;
    lead: string;
}

/** Recap output */
export interface RecapResult {
    segments: StorySegment[];
    finalStory: string;
}

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
export async function generateRecap(input: RecapServiceInput): Promise<RecapResult> {
    const { story, trollName, results } = input;

    // Build the context for the LLM
    const resultsText = results
        .sort((a, b) => a.index - b.index)
        .map((r) => `[${r.index}] "${r.bestWord}"`)
        .join("\n");

    return chatWithSchema<RecapResult>(
        RECAP_MODEL,
        [
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
        ],
        { name: "recap_result", strict: true, schema: RECAP_SCHEMA }
    );
}
