/**
 * LLM Service - OpenRouter client wrapper
 * 
 * Singleton module for LLM interactions via OpenRouter.
 */

import { OpenRouter } from "@openrouter/sdk";
import * as fs from "fs";

// ============================================================================
// Client Initialization (Lazy Singleton)
// ============================================================================

let client: OpenRouter | null = null;

function getClient(): OpenRouter {
    if (!client) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error("OPENROUTER_API_KEY environment variable is required");
        }
        client = new OpenRouter({ apiKey });
    }
    return client;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Encode an image file to base64 data URI
 */
export async function encodeImageToBase64(imagePath: string): Promise<string> {
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64Image}`;
}

/**
 * Extract string content from OpenRouter response
 * Handles both string and array content types
 */
export function extractContentString(
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
// LLM Chat Functions
// ============================================================================

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string | Array<any>;
}

export interface JsonSchema {
    name: string;
    strict: boolean;
    schema: object;
}

/**
 * Send a chat request to the LLM with JSON schema response format
 */
export async function chatWithSchema<T>(
    model: string,
    messages: ChatMessage[],
    jsonSchema: JsonSchema
): Promise<T> {
    const response = await getClient().chat.send({
        model,
        messages,
        responseFormat: {
            type: "json_schema",
            jsonSchema,
        },
        stream: false,
    });

    const content = extractContentString(response.choices?.[0]?.message?.content);
    return JSON.parse(content) as T;
}
