/**
 * LLM Service - Google Gemini client wrapper
 * 
 * Singleton module for LLM interactions via Google Gemini SDK.
 */

import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";

// ============================================================================
// Client Initialization (Lazy Singleton)
// ============================================================================

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
    if (!client) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is required");
        }
        client = new GoogleGenAI({ apiKey });
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
 * Read image file and return base64 string and mime type for Gemini inline data
 */
export async function readImageForGemini(imagePath: string): Promise<{ base64: string; mimeType: string }> {
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64 = imageBuffer.toString("base64");
    // Determine MIME type from extension
    const ext = imagePath.split('.').pop()?.toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "gif") mimeType = "image/gif";
    return { base64, mimeType };
}

/**
 * Extract string content from Gemini response
 */
export function extractContentString(
    content: string | null | undefined
): string {
    if (!content) {
        throw new Error("Response content is empty");
    }
    return content;
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
 * Convert OpenRouter-style JSON schema to Gemini schema format
 */
function convertToGeminiSchema(schema: object): object {
    // Gemini uses a similar format but may require adjustments
    // The @google/genai SDK accepts JSON schema in responseSchema
    return schema;
}

/**
 * Build Gemini contents from ChatMessage array
 * Gemini uses 'user' and 'model' roles, with system instruction handled separately
 */
function buildGeminiContents(messages: ChatMessage[]): { systemInstruction?: string; contents: any[] } {
    let systemInstruction: string | undefined;
    const contents: any[] = [];

    for (const msg of messages) {
        if (msg.role === "system") {
            // Gemini handles system prompt separately
            if (typeof msg.content === "string") {
                systemInstruction = msg.content;
            }
        } else {
            const role = msg.role === "assistant" ? "model" : "user";

            if (typeof msg.content === "string") {
                contents.push({
                    role,
                    parts: [{ text: msg.content }],
                });
            } else if (Array.isArray(msg.content)) {
                // Handle multimodal content (text + images)
                const parts: any[] = [];
                for (const item of msg.content) {
                    if (item.type === "text") {
                        parts.push({ text: item.text });
                    } else if (item.type === "image_url" && item.image_url?.url) {
                        // Parse data URI: data:image/jpeg;base64,<base64data>
                        const dataUri = item.image_url.url;
                        const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
                        if (matches) {
                            parts.push({
                                inlineData: {
                                    mimeType: matches[1],
                                    data: matches[2],
                                },
                            });
                        }
                    }
                }
                contents.push({ role, parts });
            }
        }
    }

    return systemInstruction
        ? { systemInstruction, contents }
        : { contents };
}

/**
 * Send a chat request to the LLM with JSON schema response format
 */
export async function chatWithSchema<T>(
    model: string,
    messages: ChatMessage[],
    jsonSchema: JsonSchema
): Promise<T> {
    const genAI = getClient();

    // Extract model name (remove provider prefix if present, e.g., "google/gemini-2.0-flash" -> "gemini-2.0-flash")
    const modelName = model.includes("/") ? model.split("/").pop()! : model;

    const { systemInstruction, contents } = buildGeminiContents(messages);

    const response = await genAI.models.generateContent({
        model: modelName,
        contents,
        config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            responseMimeType: "application/json",
            responseSchema: jsonSchema.schema as any,
        },
    });

    const content = response.text;
    if (!content) {
        throw new Error("Empty response from Gemini");
    }

    return JSON.parse(content) as T;
}
