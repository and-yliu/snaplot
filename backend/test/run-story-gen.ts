/**
 * Test Runner for Story Service
 * 
 * Tests the Mad Libs story generation with various round numbers.
 */

import dotenv from "dotenv";
dotenv.config();

import { generateStory, StoryGenInput } from "../src/service/story.service";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_ROUND_NUMBER = 6; // Number of blanks to generate

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTest() {
    console.log("🚀 Starting Story Generation Test...\n");

    try {
        // Check API key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("❌ OPENROUTER_API_KEY is not set in environment variables!");
            process.exit(1);
        }
        console.log(`✅ API Key loaded: ${process.env.OPENROUTER_API_KEY.substring(0, 20)}...`);

        // Generate story
        const input: StoryGenInput = { roundNumber: TEST_ROUND_NUMBER };
        console.log(`\n⚡ Generating story with ${TEST_ROUND_NUMBER} blank(s)...`);
        console.log("⏳ This may take a moment...\n");

        const startTime = Date.now();
        const result = await generateStory(input);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Story generated in ${duration}s\n`);

        // Print results
        console.log("=".repeat(80));
        console.log("📖 GENERATED STORY");
        console.log("=".repeat(80) + "\n");

        console.log("📜 Story Template:");
        console.log(`   ${result.storyTemplate}\n`);

        console.log("─".repeat(80));
        console.log("🎯 BLANKS");
        console.log("─".repeat(80));
        result.blanks.forEach((blank) => {
            console.log(`\n[${blank.index}]`);
            console.log(`   Theme: "${blank.theme}"`);
            console.log(`   Criteria: "${blank.criteria}"`);
        });

        console.log("\n" + "=".repeat(80) + "\n");

        // Save results
        const outputPath = path.join(__dirname, "story-results.json");
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`💾 Results saved to: ${outputPath}\n`);

    } catch (error) {
        console.error("\n❌ Error generating story:");
        console.error(error);
        process.exit(1);
    }
}

runTest();
