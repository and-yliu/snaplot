/**
 * Judge Service for IRL Quests
 *
 * Two specialized agents:
 * - Judge (Vision): Picks the best submission based on theme + criteria
 * - Bard (Announcer): Generates one-liner + best word for the winner
 */

import { chatWithSchema, encodeImageToBase64 } from "./llm.service";
import { JUDGE_SYSTEM_PROMPT, JUDGE_SCHEMA } from "../lib/prompts/judge.prompt";
import { BARD_SYSTEM_PROMPT, BARD_SCHEMA } from "../lib/prompts/bard.prompt";

// ============================================================================
// Types & Interfaces
// ============================================================================

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

// ============================================================================
// Model Configuration
// ============================================================================

const JUDGE_MODEL = "google/gemini-3-flash-preview";
const BARD_MODEL = "google/gemini-3-pro-preview";

// ============================================================================
// Judge Functions
// ============================================================================

/**
 * Judge Agent: Pick the best submission based on theme + criteria
 */
export async function judge(input: JudgeRoundInput): Promise<JudgeResult> {
    // Build content array with all images
    const contentParts: Array<any> = [
        {
            type: "text",
            text: `**THEME:** "${input.theme}"\n**CRITERIA:** "${input.criteria}"\n\nEvaluate the following photo submissions and pick the best one:`
        },
    ];

    // Add each submission's image with player info
    for (const sub of input.submissions) {
        contentParts.push({
            type: "text",
            text: `\n**Player ID:** ${sub.playerId} | **Name:** ${sub.playerName}`,
        });
        const base64Image = await encodeImageToBase64(sub.photoLocation);
        contentParts.push({
            type: "image_url",
            imageUrl: { url: base64Image },
        });
    }

    return chatWithSchema<JudgeResult>(
        JUDGE_MODEL,
        [
            { role: "system", content: JUDGE_SYSTEM_PROMPT },
            { role: "user", content: contentParts },
        ],
        { name: "judge_result", strict: true, schema: JUDGE_SCHEMA }
    );
}

/**
 * Bard Agent: Generate a one-liner + best word for the winner
 */
export async function bardAnnounce(
    judgesExplanation: string,
    imagePath: string
): Promise<BardResult> {
    const base64Image = await encodeImageToBase64(imagePath);

    return chatWithSchema<BardResult>(
        BARD_MODEL,
        [
            { role: "system", content: BARD_SYSTEM_PROMPT },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `**JUDGE'S EXPLANATION:** ${judgesExplanation}\n\nGenerate the one-liner and best word for this winning submission.`,
                    },
                    {
                        type: "image_url",
                        imageUrl: { url: base64Image },
                    },
                ],
            },
        ],
        { name: "bard_result", strict: true, schema: BARD_SCHEMA }
    );
}

/**
 * Main orchestrator: Run the full judging pipeline
 */
export async function judgeRound(input: JudgeRoundInput): Promise<RoundResult> {
    // Step 1: Judge picks the winner
    const judgeResult = await judge(input);

    // Step 2: Find the winner's submission
    const winnerSubmission = input.submissions.find(
        (s) => s.playerId === judgeResult.chosenPlayerId
    );
    if (!winnerSubmission) {
        throw new Error(`Winner submission not found for player ${judgeResult.chosenPlayerId}`);
    }

    // Step 3: Bard generates one-liner + best word
    const bardResult = await bardAnnounce(
        judgeResult.judgesExplanation,
        winnerSubmission.photoLocation
    );

    return {
        winnerPlayerId: judgeResult.chosenPlayerId,
        judgesExplanation: judgeResult.judgesExplanation,
        bestWord: bardResult.bestWord,
        oneLiner: bardResult.oneLiner,
    };
}
