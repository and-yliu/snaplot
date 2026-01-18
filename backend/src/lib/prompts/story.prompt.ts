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
4. Blanks should be objects that players can photograph in real life
5. The story MUST have a protagonist

**BLANK REQUIREMENTS:**
For each blank, provide a fun and creative riddle (theme), and a criteria for judging the player's submission. Here are some examples of good pairs:

**EXAMPLES OF THEMES + CRITERIA:**
- Theme: A thing that holds water but is not a cup
- Criteria: The most disgusting
- Theme: Something you acquire for free, but cost a fortune to get rid of
- Criteria: The most biologically regretful
- Theme: I cost thousands of dollars, yet I serve no purpose other than reminding you of your failures
- Criteria: The most inhuman
- **NOTE**: The criteria MUST be in the format "The most [adjective]"

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
