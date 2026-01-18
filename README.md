# 📸 Snapplot

**Snapplot** is a real-time social scavenger hunt that turns your physical surroundings into a chaotic, AI-generated story. Built for [Hackathon Name, e.g., nwHacks 2026], it bridges the gap between digital gaming and real-world interaction.

## 🚀 Inspiration
We wanted to bring the game back to reality. Instead of staring at screens, Snapplot forces players to look up, run around, and interact with the world to solve creative prompts.

## ✨ Features
- **Real-Time Multiplayer:** Instant synchronization using Socket.io (WebSocket).
- **Live Camera Scavenger Hunt:** Snap photos of objects matching the prompt (e.g., "Something round that tells time but isn't a clock").
- **Synchronized Reveals:** Dramatic, drum-roll-induced result screens where everyone sees the winner at the exact same moment.
- **AI Story Generation:** At the end of the game, your chaotic photos are stitched together into a cohesive narrative using GenAI.
- **Cross-Platform:** Runs smoothly on iOS and Android via Expo.

## 🛠️ Tech Stack
- **Frontend:** React Native (Expo), TypeScript, NativeWind (TailwindCSS)
- **Backend:** Node.js, Express, Socket.io
- **AI:** [Insert AI Model used, e.g., OpenAI API / Gemini] for story generation.
- **Image Processing:** Sharp (server-side image rotation and compression).

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo Go app on your phone (for testing)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
   *Note: Ensure your computer and phone are on the same Wi-Fi network.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update specific IP address:
   - Open `hooks/useSocket.ts`
   - Change `SERVER_URL` to your computer's local IP address (e.g., `http://192.168.1.50:3000`).
4. Start the app:
   ```bash
   npx expo start
   ```
5. Scan the QR code with your phone.

## 🎮 How to Play
1. **Host:** Create a lobby and share the 4-digit code.
2. **Join:** Friends join using the code.
3. **Hunt:** When the round starts, find the object! First to submit or best photo wins (depending on mode).
4. **Judge:** React to submissions in real-time.
5. **Reveal:** Watch the synchronized winner reveal.