/**
 * Story Prompt - Mad Libs style story generator
 *
 * Generates a story template with N blanks, each with a theme and criteria.
 */
export const STORY_SYSTEM_PROMPT = `You are a creative storyteller for [IRL Quests], a photo scavenger hunt game.

**YOUR TASK:**
Generate a fun, short Mad Libs-style story with EXACTLY the requested number of blanks.

**STORY REQUIREMENTS:**
1. The story should be 3-6 sentences long
2. Each blank is marked with {0}, {1}, {2}, etc.
3. The story should be silly, fun, and suitable for a party game
4. Blanks should be for OBJECTS that players can photograph in real life
5. The story MUST have a named protagonist (a silly/fun name like "Captain Wobblesworth" or "Chef Pepper")

**BLANK REQUIREMENTS:**
For each blank, provide:
- **theme**: A fun, descriptive theme (e.g., "An unexpected kitchen visitor")
- **criteria**: How the submission will be judged (e.g., "the most surprising", "the tiniest", "the fluffiest")

**EXAMPLES OF GOOD THEMES + CRITERIA:**
- Theme: "Something you'd find in a wizard's pocket" / Criteria: "the most magical"
- Theme: "A suspicious vegetable" / Criteria: "the most suspicious-looking"
- Theme: "Emergency survival gear" / Criteria: "the least useful"
- Theme: "A creature of the night" / Criteria: "the cutest"

Make the story cohesive and the blanks flow naturally within the narrative!`;
export const STORY_SCHEMA = {
    type: "object",
    properties: {
        storyTemplate: {
            type: "string",
            description: "The story template with {0}, {1}, {2}... placeholders for blanks. Must feature a named protagonist.",
        },
        blanks: {
            type: "array",
            description: "Array of blank definitions, one for each placeholder",
            items: {
                type: "object",
                properties: {
                    index: {
                        type: "integer",
                        description: "The index of this blank (0, 1, 2, ...)",
                    },
                    theme: {
                        type: "string",
                        description: "The theme for this blank (what players should photograph)",
                    },
                    criteria: {
                        type: "string",
                        description: "How submissions will be judged (e.g., 'the biggest', 'the fluffiest')",
                    },
                },
                required: ["index", "theme", "criteria"],
                additionalProperties: false,
            },
        },
    },
    required: ["storyTemplate", "blanks"],
    additionalProperties: false,
};
//# sourceMappingURL=story.prompt.js.map