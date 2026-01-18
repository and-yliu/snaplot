/**
 * Core Types for IRL Quests Multiplayer System
 */
export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    isReady: boolean;
    isConnected: boolean;
}
export interface GameSettings {
    rounds: number;
    roundTimeSeconds: number;
}
export declare const DEFAULT_GAME_SETTINGS: GameSettings;
export interface Lobby {
    code: string;
    players: Map<string, Player>;
    hostId: string;
    status: 'waiting' | 'starting' | 'in-game';
    maxPlayers: number;
    createdAt: number;
    settings: GameSettings;
}
export interface StoryBlank {
    index: number;
    theme: string;
    criteria: string;
}
export interface GeneratedStory {
    storyTemplate: string;
    blanks: StoryBlank[];
}
export interface PlayerGameState {
    id: string;
    name: string;
    winCount: number;
    hasSubmitted: boolean;
    photoPath?: string;
}
export interface RoundResultData {
    blankIndex: number;
    winnerId: string;
    winnerName: string;
    photoPath: string;
    objectName: string;
    oneliner: string;
}
export interface GameState {
    lobbyCode: string;
    players: Map<string, PlayerGameState>;
    currentRound: number;
    totalRounds: number;
    roundTimeSeconds: number;
    story: GeneratedStory;
    results: RoundResultData[];
    roundDeadline: number;
    status: 'waiting' | 'round' | 'judging' | 'results' | 'complete';
}
export interface FinalAwards {
    judgesFavorite: Array<{
        playerId: string;
        name: string;
        wins: number;
    }>;
    mostClueless: Array<{
        playerId: string;
        name: string;
        wins: number;
    }>;
}
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
export interface SettingsPayload {
    rounds?: number;
    roundTimeSeconds?: number;
}
export interface SubmitPhotoPayload {
    photoPath: string;
}
export interface LobbyStatePayload {
    code: string;
    players: Array<Player>;
    hostId: string;
    status: 'waiting' | 'starting' | 'in-game';
    allReady: boolean;
    settings: GameSettings;
}
export interface GameStartPayload {
    storyTemplate: string;
    blanks: StoryBlank[];
    totalRounds: number;
}
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
export interface RoundResultPayload {
    round: number;
    winnerId: string;
    winnerName: string;
    photoPath: string;
    objectName: string;
    oneliner: string;
}
export interface StorySegment {
    index: number;
    lead: string;
}
export interface GameCompletePayload {
    storyTemplate: string;
    results: RoundResultData[];
    segments: StorySegment[];
    finalStory: string;
}
export interface FinalAwardsPayload {
    judgesFavorite: Array<{
        playerId: string;
        name: string;
        wins: number;
    }>;
    mostClueless: Array<{
        playerId: string;
        name: string;
        wins: number;
    }>;
}
export interface RejoinPayload {
    code: string;
    name: string;
}
//# sourceMappingURL=types.d.ts.map