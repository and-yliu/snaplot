/**
 * Story Service for IRL Quests
 *
 * Generates Mad Libs-style stories with N blanks.
 * Each blank has a theme and criteria for photo judging.
 */

import { chatWithSchema } from "./llm.service";
import { STORY_SYSTEM_PROMPT, STORY_SCHEMA } from "../lib/prompts/story.prompt";

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Input for story generation */
export interface StoryGenInput {
    roundNumber: number;
}

/** A single blank in the story */
export interface StoryBlank {
    index: number;
    theme: string;
    criteria: string;
}

/** Generated story output */
export interface GeneratedStory {
    storyTemplate: string;
    blanks: StoryBlank[];
}

// ============================================================================
// Model Configuration
// ============================================================================

const STORY_MODEL = "google/gemini-3-pro-preview";

// ============================================================================
// Story Functions
// ============================================================================

/**
 * Generate a Mad Libs-style story with N blanks
 */
export async function generateStory(input: StoryGenInput): Promise<GeneratedStory> {
    const { roundNumber } = input;

    if (roundNumber < 1) {
        throw new Error("roundNumber must be at least 1");
    }

    return chatWithSchema<GeneratedStory>(
        STORY_MODEL,
        [
            { role: "system", content: STORY_SYSTEM_PROMPT },
            {
                role: "user",
                content: `Generate a fun Mad Libs-style story with EXACTLY ${roundNumber} blank(s). 
                
Remember:
- Use placeholders {0}, {1}, {2}, ... up to {${roundNumber - 1}}
- Provide exactly ${roundNumber} blank definition(s) in the blanks array
- Each blank needs a theme and criteria for photo submissions`,
            },
        ],
        { name: "generated_story", strict: true, schema: STORY_SCHEMA }
    );
}
