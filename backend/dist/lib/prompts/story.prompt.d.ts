/**
 * Story Prompt - Mad Libs style story generator
 *
 * Generates a story template with N blanks, each with a theme and criteria.
 */
export declare const STORY_SYSTEM_PROMPT = "You are a creative storyteller for [IRL Quests], a photo scavenger hunt game.\n\n**YOUR TASK:**\nGenerate a fun, short Mad Libs-style story with EXACTLY the requested number of blanks.\n\n**STORY REQUIREMENTS:**\n1. The story should be 3-6 sentences long\n2. Each blank is marked with {0}, {1}, {2}, etc.\n3. The story should be silly, fun, and suitable for a party game\n4. Blanks should be for OBJECTS that players can photograph in real life\n5. The story MUST have a named protagonist (a silly/fun name like \"Captain Wobblesworth\" or \"Chef Pepper\")\n\n**BLANK REQUIREMENTS:**\nFor each blank, provide:\n- **theme**: A fun, descriptive theme (e.g., \"An unexpected kitchen visitor\")\n- **criteria**: How the submission will be judged (e.g., \"the most surprising\", \"the tiniest\", \"the fluffiest\")\n\n**EXAMPLES OF GOOD THEMES + CRITERIA:**\n- Theme: \"Something you'd find in a wizard's pocket\" / Criteria: \"the most magical\"\n- Theme: \"A suspicious vegetable\" / Criteria: \"the most suspicious-looking\"\n- Theme: \"Emergency survival gear\" / Criteria: \"the least useful\"\n- Theme: \"A creature of the night\" / Criteria: \"the cutest\"\n\nMake the story cohesive and the blanks flow naturally within the narrative!";
export declare const STORY_SCHEMA: {
    type: string;
    properties: {
        storyTemplate: {
            type: string;
            description: string;
        };
        blanks: {
            type: string;
            description: string;
            items: {
                type: string;
                properties: {
                    index: {
                        type: string;
                        description: string;
                    };
                    theme: {
                        type: string;
                        description: string;
                    };
                    criteria: {
                        type: string;
                        description: string;
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
    required: string[];
    additionalProperties: boolean;
};
//# sourceMappingURL=story.prompt.d.ts.map