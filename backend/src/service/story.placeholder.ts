/**
 * Story Service Placeholder
 * 
 * This is a placeholder for the StoryService that will be implemented by a teammate.
 * It provides mock data for development and testing.
 */

import type { GeneratedStory, StoryBlank } from '../lib/types/types.js';

// ============================================================================
// Mock Story Data (for development)
// ============================================================================

const MOCK_STORIES: GeneratedStory[] = [
    {
        template: `Once upon a time in a magical land, a brave adventurer discovered {0}. 
With great courage, they used it to defeat {1}. 
Along the way, they befriended {2} who helped them find the legendary {3}. 
And they all lived happily ever after!`,
        blanks: [
            { index: 0, theme: "A mysterious glowing object", criteria: "Something that appears to glow or emit light" },
            { index: 1, theme: "A fearsome creature", criteria: "Something that looks scary or dangerous" },
            { index: 2, theme: "A quirky companion", criteria: "Something cute, funny, or unusual" },
            { index: 3, theme: "A legendary treasure", criteria: "Something valuable or shiny" },
        ]
    },
    {
        template: `In the year 3000, space explorer Captain Nova found {0} floating in the asteroid belt.
The alien artifact led them to a hidden planet where {1} guarded an ancient secret.
With the help of {2}, they unlocked the mystery of {3}.
The galaxy was forever changed!`,
        blanks: [
            { index: 0, theme: "A strange alien artifact", criteria: "Something unusual or otherworldly looking" },
            { index: 1, theme: "An ancient guardian", criteria: "Something old, wise, or protective" },
            { index: 2, theme: "A technological marvel", criteria: "Something electronic or mechanical" },
            { index: 3, theme: "The ultimate power source", criteria: "Something energetic or powerful" },
        ]
    },
    {
        template: `Chef extraordinaire Pepper was preparing for the ultimate cook-off when {0} arrived at the kitchen.
The secret ingredient turned out to be {1}, which had to be combined with {2}.
The resulting dish, known as {3}, won first place!`,
        blanks: [
            { index: 0, theme: "An unexpected kitchen visitor", criteria: "Something or someone surprising in a kitchen" },
            { index: 1, theme: "A secret ingredient", criteria: "Something edible or food-related" },
            { index: 2, theme: "A magical spice", criteria: "Something colorful or aromatic" },
            { index: 3, theme: "The winning dish", criteria: "Something that looks delicious" },
        ]
    }
];

// ============================================================================
// Story Service Placeholder
// ============================================================================

/**
 * Generate a story with the specified number of blanks
 * PLACEHOLDER: Will be replaced with AI-generated stories by teammate
 */
export async function generateStory(numBlanks: number): Promise<GeneratedStory> {
    // For now, pick a random mock story
    const randomIndex = Math.floor(Math.random() * MOCK_STORIES.length);
    const story = MOCK_STORIES[randomIndex];

    if (!story) {
        // Fallback if something goes wrong
        return {
            template: "The adventurer found {0}, {1}, {2}, and {3}. The end!",
            blanks: Array.from({ length: numBlanks }, (_, i) => ({
                index: i,
                theme: `Mystery object #${i + 1}`,
                criteria: "Find something interesting",
            }))
        };
    }

    // Trim blanks if needed
    if (numBlanks < story.blanks.length) {
        return {
            template: story.template,
            blanks: story.blanks.slice(0, numBlanks)
        };
    }

    return story;
}

// Export type for teammate's implementation
export type GenerateStoryFn = typeof generateStory;
