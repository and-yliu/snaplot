/**
 * LLM Service - OpenRouter client wrapper
 *
 * Singleton module for LLM interactions via OpenRouter.
 */
/**
 * Encode an image file to base64 data URI
 */
export declare function encodeImageToBase64(imagePath: string): Promise<string>;
/**
 * Extract string content from OpenRouter response
 * Handles both string and array content types
 */
export declare function extractContentString(content: string | Array<any> | null | undefined): string;
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
export declare function chatWithSchema<T>(model: string, messages: ChatMessage[], jsonSchema: JsonSchema): Promise<T>;
//# sourceMappingURL=llm.service.d.ts.map