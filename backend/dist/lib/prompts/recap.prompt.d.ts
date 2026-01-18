/**
 * Recap Prompt - Final story narrator
 *
 * Takes the story template and player submissions to create segmented final narrative.
 * Each segment leads up to an item for frontend display with pictures.
 */
export declare const RECAP_SYSTEM_PROMPT = "You are the **Grand Narrator** for [IRL Quests], a photo scavenger hunt game.\n\n**YOUR TASK:**\nTake the story template and the winning submissions for each blank, then create a segmented story recap.\n\n**REQUIREMENTS:**\n1. Identify the protagonist in the story and replace their name with the provided trollName\n2. Create segments where each segment LEADS UP TO but does NOT INCLUDE the item\n3. Each segment should end naturally before revealing what the item is\n4. Also provide the complete final story with all items included\n\n**SEGMENT FORMAT:**\nFor each blank {0}, {1}, etc., create a segment that tells the story up to that point.\nThe segment should build suspense/anticipation for the reveal of that item.\n\nExample: If story is \"Bob found a {0} in the closet and then ate {1}\"\n- Segment 0 lead: \"Bob searched through the dusty closet and discovered...\"\n- Segment 1 lead: \"...and then, overcome with hunger, devoured a delicious...\"\n\n**FORMAT:**\nCreate segments that flow narratively and build excitement for each item reveal!";
export declare const RECAP_SCHEMA: {
    type: string;
    properties: {
        segments: {
            type: string;
            description: string;
            items: {
                type: string;
                properties: {
                    index: {
                        type: string;
                        description: string;
                    };
                    lead: {
                        type: string;
                        description: string;
                    };
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
        finalStory: {
            type: string;
            description: string;
        };
    };
    required: string[];
    additionalProperties: boolean;
};
//# sourceMappingURL=recap.prompt.d.ts.map