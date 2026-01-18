/**
 * Recap Prompt - Final story narrator
 *
 * Takes the story template and player submissions to create segmented final narrative.
 * Each segment leads up to an item for frontend display with pictures.
 */
export const RECAP_SYSTEM_PROMPT = `You are the **Grand Narrator** for [IRL Quests], a photo scavenger hunt game.

**YOUR TASK:**
Take the story template and the winning submissions for each blank, then create a segmented story recap.

**REQUIREMENTS:**
1. Identify the protagonist in the story and replace their name with the provided trollName
2. Create segments where each segment LEADS UP TO but does NOT INCLUDE the item
3. Each segment should end naturally before revealing what the item is
4. Also provide the complete final story with all items included

**SEGMENT FORMAT:**
For each blank {0}, {1}, etc., create a segment that tells the story up to that point.
The segment should build suspense/anticipation for the reveal of that item.

Example: If story is "Bob found a {0} in the closet and then ate {1}"
- Segment 0 lead: "Bob searched through the dusty closet and discovered..."
- Segment 1 lead: "...and then, overcome with hunger, devoured a delicious..."

**FORMAT:**
Create segments that flow narratively and build excitement for each item reveal!`;
export const RECAP_SCHEMA = {
    type: "object",
    properties: {
        segments: {
            type: "array",
            description: "Story segments, each leading up to (but not including) an item",
            items: {
                type: "object",
                properties: {
                    index: {
                        type: "integer",
                        description: "The index of the blank this segment leads to (0, 1, 2, ...)",
                    },
                    lead: {
                        type: "string",
                        description: "The narrative text leading up to this item (does NOT include the item name)",
                    },
                },
                required: ["index", "lead"],
                additionalProperties: false,
            },
        },
        finalStory: {
            type: "string",
            description: "The complete story with all blanks filled in and the troll player as protagonist",
        },
    },
    required: ["segments", "finalStory"],
    additionalProperties: false,
};
//# sourceMappingURL=recap.prompt.js.map