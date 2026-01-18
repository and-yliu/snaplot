/**
 * Story Service for IRL Quests
 *
 * Generates Mad Libs-style stories with N blanks.
 * Each blank has a theme and criteria for photo judging.
 */
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
/**
 * Generate a Mad Libs-style story with N blanks
 */
export declare function generateStory(input: StoryGenInput): Promise<GeneratedStory>;
//# sourceMappingURL=story.service.d.ts.map