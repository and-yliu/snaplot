# Judge Service Test Runner

This test runner demonstrates the complete multi-agent judge system by processing all images in the `uploads` folder.

## Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Configure API key**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your OpenRouter API key:
     ```
     OPENROUTER_API_KEY=your_actual_api_key_here
     ```
   - Get your API key from: https://openrouter.ai/keys

3. **Add test images**:
   - Place your test images in the `uploads/` directory
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
   - The current test has 4 images: IMG_1203.jpg, IMG_1204.jpg, IMG_1205.jpg, IMG_1206.jpg

## Running the Test

Run the test with:
```bash
npm run test:judge
```

## What Happens

The test runner will:

1. **Scan** the `uploads/` directory for all image files
2. **Create** player submissions (one per image)
3. **Run** the full judge round:
   - 🔍 **Scout Agent** analyzes each image against the riddle
   - ⚖️ **High Council** judges all submissions and picks winners
   - 📢 **Bard** generates announcements for the winners
4. **Display** formatted results in the console
5. **Save** detailed results to `test/judge-results.json`

## Test Configuration

You can customize the test by editing `test/run-judge-round.ts`:

- **Riddle**: Change `TEST_RIDDLE` constant (line ~22)
- **Upload directory**: Change `UPLOADS_DIR` constant (line ~21)

## Sample Output

```
🚀 Starting Judge Round Test...

📁 Reading images from: /path/to/uploads
✅ Found 4 image(s):
   1. IMG_1203.jpg
   2. IMG_1204.jpg
   3. IMG_1205.jpg
   4. IMG_1206.jpg

⚡ Running judge round with riddle: "Find something red and round in your surroundings"
⏳ This may take a minute...

✅ Judge round completed in 12.34s

================================================================================
🎮 JUDGE ROUND RESULTS
================================================================================

📜 Riddle: "Find something red and round in your surroundings"

[... detailed scout analyses, council judgment, and bard announcements ...]

💾 Results saved to: /path/to/test/judge-results.json
```

## Troubleshooting

- **"No images found"**: Make sure you have image files in the `uploads/` directory
- **API errors**: Check that your `OPENROUTER_API_KEY` is valid in `.env`
- **Module errors**: Make sure you've run `npm install`

## What Gets Tested

This test validates:
- ✅ Image encoding and upload to vision models
- ✅ Scout agent's image analysis capabilities
- ✅ High Council's judging and winner selection logic
- ✅ Bard's creative announcement generation
- ✅ Overall pipeline orchestration and error handling
