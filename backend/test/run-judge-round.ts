/**
 * Test Runner for Judge Service
 * 
 * This script reads all images from the uploads folder and runs
 * a complete judge round to test the 2-agent system (Judge + Bard).
 */

// IMPORTANT: Load environment variables FIRST before any other imports
// The OpenRouter SDK reads env vars when it's first imported
import dotenv from "dotenv";
dotenv.config();

import { judgeRound, JudgeRoundInput, PlayerSubmission } from "../src/service/judge.service";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Configuration
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Test configuration
const TEST_THEME = "Something you would use when in a fight with crocodiles";
const TEST_CRITERIA = "The weakest";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read all image files from the uploads directory
 */
function getImageFiles(directory: string): string[] {
    const files = fs.readdirSync(directory);
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    return files
        .filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        })
        .map((file) => path.join(directory, file));
}

/**
 * Create player submissions from image files
 */
function createSubmissions(imagePaths: string[]): PlayerSubmission[] {
    return imagePaths.map((imagePath, index) => ({
        playerId: `player_${index + 1}`,
        playerName: `Player ${index + 1}`,
        photoLocation: imagePath,
    }));
}

/**
 * Pretty print the round results
 */
function printResults(result: any, theme: string, criteria: string) {
    console.log("\n" + "=".repeat(80));
    console.log("🎮 JUDGE ROUND RESULTS");
    console.log("=".repeat(80) + "\n");

    console.log(`📜 Theme: "${theme}"`);
    console.log(`📏 Criteria: "${criteria}"\n`);

    console.log("─".repeat(80));
    console.log("⚖️  JUDGE'S DECISION");
    console.log("─".repeat(80));
    console.log(`\nChosen Player: ${result.winnerPlayerId}`);
    console.log(`Explanation: ${result.judgesExplanation}`);

    console.log("\n" + "─".repeat(80));
    console.log("🎭 BARD'S ANNOUNCEMENT");
    console.log("─".repeat(80));
    console.log(`\nBest Word: "${result.bestWord}"`);
    console.log(`One-Liner: "${result.oneLiner}"`);

    console.log("\n" + "=".repeat(80) + "\n");
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTest() {
    console.log("🚀 Starting Judge Round Test...\n");

    try {
        // Step 1: Get all image files
        console.log(`📁 Reading images from: ${UPLOADS_DIR}`);
        const imagePaths = getImageFiles(UPLOADS_DIR);

        if (imagePaths.length === 0) {
            console.error("❌ No images found in uploads directory!");
            process.exit(1);
        }

        console.log(`✅ Found ${imagePaths.length} image(s):`);
        imagePaths.forEach((imgPath, idx) => {
            console.log(`   ${idx + 1}. ${imgPath.split("/").pop()}`);
        });

        // Step 2: Create player submissions
        console.log("\n📝 Creating player submissions...");
        const submissions = createSubmissions(imagePaths);

        // Step 3: Prepare judge round input
        const input: JudgeRoundInput = {
            theme: TEST_THEME,
            criteria: TEST_CRITERIA,
            submissions,
        };

        // Debug: Check API key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("❌ OPENROUTER_API_KEY is not set in environment variables!");
            process.exit(1);
        }
        console.log(`✅ API Key loaded: ${process.env.OPENROUTER_API_KEY.substring(0, 20)}...`);

        // Step 4: Run the judge round
        console.log(`\n⚡ Running judge round...`);
        console.log(`   Theme: "${TEST_THEME}"`);
        console.log(`   Criteria: "${TEST_CRITERIA}"`);
        console.log("⏳ This may take a moment...\n");

        const startTime = Date.now();
        const result = await judgeRound(input);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Judge round completed in ${duration}s`);

        // Step 5: Print results
        printResults(result, TEST_THEME, TEST_CRITERIA);

        // Step 6: Save results to file
        const outputPath = path.join(__dirname, "judge-results.json");
        const fullResult = {
            theme: TEST_THEME,
            criteria: TEST_CRITERIA,
            ...result,
        };
        fs.writeFileSync(outputPath, JSON.stringify(fullResult, null, 2));
        console.log(`💾 Results saved to: ${outputPath}\n`);

    } catch (error) {
        console.error("\n❌ Error running judge round:");
        console.error(error);
        process.exit(1);
    }
}

// Run the test
runTest();
