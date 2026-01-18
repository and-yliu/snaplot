/**
 * Test Runner for Recap Service
 * 
 * Tests the final story recap generation.
 */

import dotenv from "dotenv";
dotenv.config();

import { generateRecap, RecapServiceInput } from "../src/service/recap.service";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Test Data
// ============================================================================

const TEST_INPUT: RecapServiceInput = {
    story: `To prepare for the epic space voyage, first officer Barnaby packed a luggage bag filled with {0}. Suddenly, the ship's engine malfunctioned and could only be fixed by inserting {1} into the fuel tank. To celebrate the successful repair, the crew held a zero-gravity banquet featuring a delicious {2}. By the time they reached the moon, the captain declared that {3} would be the official currency of the new colony.`,
    trollName: "Bob the Loser",
    results: [
        { index: 0, bestWord: "Rubber Duck" },
        { index: 1, bestWord: "Banana" },
        { index: 2, bestWord: "Pizza Slice" },
        { index: 3, bestWord: "Shiny Spoon" },
    ],
};

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTest() {
    console.log("🚀 Starting Recap Generation Test...\n");

    try {
        // Check API key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("❌ OPENROUTER_API_KEY is not set in environment variables!");
            process.exit(1);
        }
        console.log(`✅ API Key loaded: ${process.env.OPENROUTER_API_KEY.substring(0, 20)}...`);

        // Generate recap
        console.log(`\n⚡ Generating story recap...`);
        console.log("⏳ This may take a moment...\n");

        const startTime = Date.now();
        const result = await generateRecap(TEST_INPUT);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Recap generated in ${duration}s\n`);

        // Print results
        console.log("=".repeat(80));
        console.log("📖 SEGMENTED STORY RECAP");
        console.log("=".repeat(80) + "\n");

        console.log("─".repeat(80));
        console.log("📑 SEGMENTS (for frontend display with item pictures)");
        console.log("─".repeat(80));
        result.segments.forEach((seg) => {
            console.log(`\n[${seg.index}] ${seg.lead}`);
            console.log(`    → [ITEM: ${TEST_INPUT.results[seg.index]?.bestWord}]`);
        });

        console.log("\n" + "─".repeat(80));
        console.log("📜 FINAL STORY (complete)");
        console.log("─".repeat(80));
        console.log(`\n${result.finalStory}`);
        console.log("\n" + "=".repeat(80) + "\n");

        // Save results
        const outputPath = path.join(__dirname, "recap-results.json");
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`💾 Results saved to: ${outputPath}\n`);

    } catch (error) {
        console.error("\n❌ Error generating recap:");
        console.error(error);
        process.exit(1);
    }
}

runTest();
