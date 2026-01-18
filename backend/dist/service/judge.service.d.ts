/**
 * Judge Service for IRL Quests
 *
 * Two specialized agents:
 * - Judge (Vision): Picks the best submission based on theme + criteria
 * - Bard (Announcer): Generates one-liner + best word for the winner
 */
/** Player submission input */
export interface PlayerSubmission {
    playerId: string;
    playerName: string;
    photoLocation: string;
}
/** Input for a judge round */
export interface JudgeRoundInput {
    theme: string;
    criteria: string;
    submissions: PlayerSubmission[];
}
/** Judge Agent output: chosen winner */
export interface JudgeResult {
    chosenPlayerId: string;
    judgesExplanation: string;
}
/** Bard Agent output: one-liner + best word */
export interface BardResult {
    oneLiner: string;
    bestWord: string;
}
/** Final round result */
export interface RoundResult {
    winnerPlayerId: string;
    judgesExplanation: string;
    bestWord: string;
    oneLiner: string;
}
/**
 * Judge Agent: Pick the best submission based on theme + criteria
 */
export declare function judge(input: JudgeRoundInput): Promise<JudgeResult>;
/**
 * Bard Agent: Generate a one-liner + best word for the winner
 */
export declare function bardAnnounce(judgesExplanation: string, imagePath: string): Promise<BardResult>;
/**
 * Main orchestrator: Run the full judging pipeline
 */
export declare function judgeRound(input: JudgeRoundInput): Promise<RoundResult>;
//# sourceMappingURL=judge.service.d.ts.map