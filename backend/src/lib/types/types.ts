/**
 * Core Types for IRL Quests Multiplayer System
 */

// ============================================================================
// Player & Lobby Types
// ============================================================================

export interface Player {
    id: string;          // Socket ID
    name: string;        // Display name
    isHost: boolean;
    isReady: boolean;
}

export interface Lobby {
    code: string;        // 4-char join code
    players: Map<string, Player>;
    hostId: string;
    status: 'waiting' | 'starting' | 'in-game';
    maxPlayers: number;
    createdAt: number;
}

// ============================================================================
// Story Types
// ============================================================================

export interface StoryBlank {
    index: number;
    theme: string;           // e.g., "A mysterious red object"
    criteria: string;        // What AI looks for (single string now per teammate's interface)
}

export interface GeneratedStory {
    template: string;        // Story with {0}, {1}, {2}... placeholders
    blanks: StoryBlank[];    // One per placeholder
}

// ============================================================================
// Game Types
// ============================================================================

export interface PlayerGameState {
    id: string;
    name: string;
    winCount: number;        // Track wins for awards
    hasSubmitted: boolean;
    photoPath?: string;
}

export interface RoundResultData {
    blankIndex: number;
    winnerId: string;
    winnerName: string;
    photoPath: string;
    objectName: string;      // bestWord from judge
    oneliner: string;        // AI's funny one-liner
}

export interface GameState {
    lobbyCode: string;
    players: Map<string, PlayerGameState>;
    currentRound: number;
    totalRounds: number;
    story: GeneratedStory;
    results: RoundResultData[];   // Filled as rounds complete
    roundDeadline: number;        // Unix timestamp (ms)
    status: 'waiting' | 'round' | 'judging' | 'results' | 'complete';
}

export interface FinalAwards {
    judgesFavorite: Array<{ playerId: string; name: string; wins: number }>;
    mostClueless: Array<{ playerId: string; name: string; wins: number }>;
}

// ============================================================================
// Socket Event Payloads
// ============================================================================

// Lobby events
export interface CreateLobbyPayload {
    name: string;
}

export interface JoinLobbyPayload {
    code: string;
    name: string;
}

export interface ReadyPayload {
    ready: boolean;
}

// Game events
export interface SubmitPhotoPayload {
    photoPath: string;
}

// Lobby state broadcast
export interface LobbyStatePayload {
    code: string;
    players: Array<{
        id: string;
        name: string;
        isHost: boolean;
        isReady: boolean;
    }>;
    hostId: string;
    status: 'waiting' | 'starting' | 'in-game';
    allReady: boolean;
}

// Game start payload
export interface GameStartPayload {
    storyTemplate: string;
    blanks: StoryBlank[];
    totalRounds: number;
}

// Round payload
export interface RoundPayload {
    round: number;
    totalRounds: number;
    theme: string;
    criteria: string;
    deadline: number;
    remainingSeconds: number;
}

export interface TickPayload {
    remainingSeconds: number;
}

export interface PlayerSubmittedPayload {
    playerId: string;
    playerName: string;
}

// Round result payload
export interface RoundResultPayload {
    round: number;
    winnerId: string;
    winnerName: string;
    photoPath: string;
    objectName: string;
    oneliner: string;
}

// Game complete payload
export interface GameCompletePayload {
    storyTemplate: string;
    results: RoundResultData[];
}

// Final awards payload
export interface FinalAwardsPayload {
    judgesFavorite: Array<{ playerId: string; name: string; wins: number }>;
    mostClueless: Array<{ playerId: string; name: string; wins: number }>;
}
