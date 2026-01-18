/**
 * Recap Service for IRL Quests
 *
 * Generates the final story recap from gameplay results.
 */
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
/**
 * Generate the final story recap from gameplay results
 */
export declare function generateRecap(input: RecapServiceInput): Promise<RecapResult>;
//# sourceMappingURL=recap.service.d.ts.map