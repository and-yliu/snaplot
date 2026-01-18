/**
 * Judge Service for IRL Quests
 *
 * Two specialized agents:
 * - Judge (Vision): Picks the best submission based on theme + criteria
 * - Bard (Announcer): Generates one-liner + best word for the winner
 */

import { OpenRouter } from "@openrouter/sdk";
import * as fs from "fs";
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
    bestWord: string;
    oneLiner: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Encode an image file to base64 data URI
 */
async function encodeImageToBase64(imagePath: string): Promise<string> {
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64Image}`;
}

/**
 * Extract string content from OpenRouter response
 * Handles both string and array content types
 */
function extractContentString(
    content: string | Array<any> | null | undefined
): string {
    if (!content) {
        throw new Error("Response content is empty");
    }
    if (typeof content === "string") {
        return content;
    }
    // If it's an array, find the first text item
    const textItem = content.find((item) => item.type === "text");
    if (textItem?.text) {
        return textItem.text;
    }
    throw new Error("Unable to extract text content from response");
}

// ============================================================================
// Judge Service Class
// ============================================================================

export class JudgeService {
    private client: OpenRouter;

    // Model assignments per agent
    private readonly JUDGE_MODEL = "google/gemini-2.0-flash-001";
    private readonly BARD_MODEL = "google/gemini-2.0-flash-001";

    constructor(apiKey?: string) {
        const key = apiKey || process.env.OPENROUTER_API_KEY;
        if (!key) {
            throw new Error("OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass apiKey to constructor.");
        }
        this.client = new OpenRouter({
            apiKey: key,
        });
    }

    /**
     * Judge Agent: Pick the best submission based on theme + criteria
     */
    async judge(input: JudgeRoundInput): Promise<JudgeResult> {
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

        const response = await this.client.chat.send({
            model: this.JUDGE_MODEL,
            messages: [
                { role: "system", content: JUDGE_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: contentParts,
                },
            ],
            responseFormat: {
                type: "json_schema",
                jsonSchema: {
                    name: "judge_result",
                    strict: true,
                    schema: JUDGE_SCHEMA,
                },
            },
            stream: false,
        });

        const content = extractContentString(response.choices?.[0]?.message?.content);
        return JSON.parse(content) as JudgeResult;
    }

    /**
     * Bard Agent: Generate a one-liner + best word for the winner
     */
    async bardAnnounce(
        judgesExplanation: string,
        imagePath: string
    ): Promise<BardResult> {
        // Read and encode the image
        const base64Image = await encodeImageToBase64(imagePath);

        const response = await this.client.chat.send({
            model: this.BARD_MODEL,
            messages: [
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
            responseFormat: {
                type: "json_schema",
                jsonSchema: {
                    name: "bard_result",
                    strict: true,
                    schema: BARD_SCHEMA,
                },
            },
            stream: false,
        });

        const content = extractContentString(response.choices?.[0]?.message?.content);
        return JSON.parse(content) as BardResult;
    }

    /**
     * Main orchestrator: Run the full judging pipeline
     */
    async judgeRound(input: JudgeRoundInput): Promise<RoundResult> {
        // Step 1: Judge picks the winner
        const judgeResult = await this.judge(input);

        // Step 2: Find the winner's submission
        const winnerSubmission = input.submissions.find(
            (s) => s.playerId === judgeResult.chosenPlayerId
        );
        if (!winnerSubmission) {
            throw new Error(`Winner submission not found for player ${judgeResult.chosenPlayerId}`);
        }

        // Step 3: Bard generates one-liner + best word
        const bardResult = await this.bardAnnounce(
            judgeResult.judgesExplanation,
            winnerSubmission.photoLocation
        );

        return {
            winnerPlayerId: judgeResult.chosenPlayerId,
            bestWord: bardResult.bestWord,
            oneLiner: bardResult.oneLiner,
        };
    }
}

// Export singleton instance
export const judgeService = new JudgeService();
