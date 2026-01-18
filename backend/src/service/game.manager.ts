/**
 * GameManager - Story-based game state management
 */

import type {
    GameState,
    PlayerGameState,
    GeneratedStory,
    RoundResultData,
    RoundPayload,
    RoundResultPayload,
    GameCompletePayload,
    FinalAwards,
    FinalAwardsPayload,
    GameStartPayload,
} from '../lib/types/types.js';
import type { Lobby } from '../lib/types/types.js';
import { generateStory, type StoryGenInput } from './story.service.js';
import { generateRecap, type BlankResult, type RecapResult } from './recap.service.js';
import { judgeRound, type JudgeRoundInput, type PlayerSubmission, type RoundResult } from './judge.service.js';

// ============================================================================
// Game Manager Class
// ============================================================================

export class GameManager {
    private games: Map<string, GameState> = new Map();
    private roundTimers: Map<string, NodeJS.Timeout> = new Map();
    private tickIntervals: Map<string, NodeJS.Timeout> = new Map();
    private nextRoundReady: Map<string, Set<string>> = new Map();

    // Grace period for late submissions (handles network latency)
    private static readonly SUBMISSION_GRACE_PERIOD_MS = 3000;

    // Callbacks for socket events
    private onTick: ((lobbyCode: string, remainingSeconds: number) => void) | undefined = undefined;
    private onRoundEnd: ((lobbyCode: string) => void) | undefined = undefined;
    private onGracePeriodStart: ((lobbyCode: string) => void) | undefined = undefined;
    private onAllSubmitted: ((lobbyCode: string) => void) | undefined = undefined;

    /**
     * Register event callbacks
     */
    setCallbacks(callbacks: {
        onTick?: (lobbyCode: string, remainingSeconds: number) => void;
        onRoundEnd?: (lobbyCode: string) => void;
        onGracePeriodStart?: (lobbyCode: string) => void;
        onAllSubmitted?: (lobbyCode: string) => void;
    }) {
        this.onTick = callbacks.onTick;
        this.onRoundEnd = callbacks.onRoundEnd;
        this.onGracePeriodStart = callbacks.onGracePeriodStart;
        this.onAllSubmitted = callbacks.onAllSubmitted;
    }

    /**
     * Initialize a new game from a lobby
     */
    async startGame(lobby: Lobby): Promise<GameState> {
        const players = new Map<string, PlayerGameState>();

        for (const [id, player] of lobby.players) {
            players.set(id, {
                id,
                name: player.name,
                winCount: 0,
                hasSubmitted: false,
            });
        }

        // Use settings from lobby
        const { rounds, roundTimeSeconds } = lobby.settings;

        // Generate story with blanks matching total rounds
        const input: StoryGenInput = { roundNumber: rounds };
        const story: GeneratedStory = await generateStory(input);
        const deadline = Date.now() + (roundTimeSeconds * 1000);

        const game: GameState = {
            lobbyCode: lobby.code,
            players,
            currentRound: 1,
            totalRounds: story.blanks.length, // Use actual blanks count
            roundTimeSeconds,
            story,
            results: [],
            roundDeadline: deadline,
            status: 'round',
        };

        this.games.set(lobby.code, game);
        this.startRoundTimer(lobby.code);

        return game;
    }

    /**
     * Get the current round's blank
     */
    getCurrentBlank(game: GameState) {
        return game.story.blanks[game.currentRound - 1];
    }

    /**
     * End a round exactly once (deadline, all-submitted, disconnect).
     * This prevents duplicate judging/results/next-round emits caused by race conditions.
     */
    private tryEndRound(lobbyCode: string): boolean {
        const game = this.games.get(lobbyCode);
        if (!game) return false;
        if (game.status !== 'round') return false;

        // Lock the round immediately to prevent double-trigger
        game.status = 'judging';
        this.clearTimers(lobbyCode);

        if (this.onRoundEnd) {
            this.onRoundEnd(lobbyCode);
        }

        return true;
    }

    /**
     * Reset next-round readiness tracking for a lobby.
     * Call after broadcasting a round result (or when starting a new round).
     */
    resetNextRoundReady(lobbyCode: string): void {
        this.nextRoundReady.set(lobbyCode, new Set());
    }

    /**
     * Mark a player as ready to proceed from results -> next round/complete.
     * Returns current counts for UI.
     */
    setPlayerReadyForNextRound(lobbyCode: string, playerId: string): { readyCount: number; totalPlayers: number; allReady: boolean } {
        const game = this.games.get(lobbyCode);
        if (!game) {
            return { readyCount: 0, totalPlayers: 0, allReady: false };
        }

        if (!this.nextRoundReady.has(lobbyCode)) {
            this.nextRoundReady.set(lobbyCode, new Set());
        }

        const readySet = this.nextRoundReady.get(lobbyCode)!;
        readySet.add(playerId);

        const totalPlayers = game.players.size;
        const readyCount = readySet.size;
        const allReady = totalPlayers > 0 && readyCount >= totalPlayers;

        return { readyCount, totalPlayers, allReady };
    }

    getNextRoundReadyStatus(lobbyCode: string): { readyCount: number; totalPlayers: number; allReady: boolean } {
        const game = this.games.get(lobbyCode);
        if (!game) return { readyCount: 0, totalPlayers: 0, allReady: false };

        const readySet = this.nextRoundReady.get(lobbyCode) ?? new Set<string>();
        const totalPlayers = game.players.size;
        const readyCount = readySet.size;
        const allReady = totalPlayers > 0 && readyCount >= totalPlayers;
        return { readyCount, totalPlayers, allReady };
    }

    removePlayerFromGame(lobbyCode: string, playerId: string): void {
        const game = this.games.get(lobbyCode);
        if (!game) return;

        game.players.delete(playerId);
        this.nextRoundReady.get(lobbyCode)?.delete(playerId);
    }

    /**
     * Start the round timer
     */
    private startRoundTimer(lobbyCode: string) {
        // Clear any existing timers
        this.clearTimers(lobbyCode);

        const game = this.games.get(lobbyCode);
        if (!game) return;

        // Tick every second
        const tickInterval = setInterval(() => {
            const currentGame = this.games.get(lobbyCode);
            if (!currentGame || currentGame.status !== 'round') {
                this.clearTimers(lobbyCode);
                return;
            }

            const remaining = Math.max(0, Math.ceil((currentGame.roundDeadline - Date.now()) / 1000));

            if (this.onTick) {
                this.onTick(lobbyCode, remaining);
            }

            // When timer hits 0, wait for grace period before starting judging
            // This allows in-flight submissions to arrive
            if (remaining <= 0) {
                this.clearTimers(lobbyCode);
                // Notify immediately that grace period started (show "Judging..." UI)
                if (this.onGracePeriodStart) {
                    this.onGracePeriodStart(lobbyCode);
                }
                setTimeout(() => {
                    this.tryEndRound(lobbyCode);
                }, GameManager.SUBMISSION_GRACE_PERIOD_MS);
            }
        }, 1000);

        this.tickIntervals.set(lobbyCode, tickInterval);
    }

    /**
     * Clear timers for a game
     */
    private clearTimers(lobbyCode: string) {
        const timer = this.roundTimers.get(lobbyCode);
        if (timer) {
            clearTimeout(timer);
            this.roundTimers.delete(lobbyCode);
        }

        const interval = this.tickIntervals.get(lobbyCode);
        if (interval) {
            clearInterval(interval);
            this.tickIntervals.delete(lobbyCode);
        }
    }

    /**
     * Submit a photo for the current round
     */
    submitPhoto(lobbyCode: string, playerId: string, photoPath: string): boolean {
        const game = this.games.get(lobbyCode);
        if (!game || game.status !== 'round') {
            return false;
        }

        const player = game.players.get(playerId);
        if (!player || player.hasSubmitted) {
            return false;
        }

        // Check if deadline passed (with grace period for network latency)
        if (Date.now() > game.roundDeadline + GameManager.SUBMISSION_GRACE_PERIOD_MS) {
            return false;
        }

        player.hasSubmitted = true;
        player.photoPath = photoPath;

        // Check if all players have submitted
        if (this.allPlayersSubmitted(lobbyCode)) {
            // Emit judging indicator immediately (same as grace period start)
            if (this.onAllSubmitted) {
                this.onAllSubmitted(lobbyCode);
            }
            this.tryEndRound(lobbyCode);
        }

        return true;
    }

    /**
     * Check if all players have submitted
     */
    allPlayersSubmitted(lobbyCode: string): boolean {
        const game = this.games.get(lobbyCode);
        if (!game) return false;

        for (const player of game.players.values()) {
            if (!player.hasSubmitted) {
                return false;
            }
        }
        return true;
    }

    /**
     * Judge the current round - picks ONE winner
     */
    async judgeRound(lobbyCode: string): Promise<RoundResultData | null> {
        const game = this.games.get(lobbyCode);
        if (!game) return null;

        game.status = 'judging';

        const currentBlank = this.getCurrentBlank(game);
        if (!currentBlank) {
            console.error('No blank found for current round');
            game.status = 'results';
            return null;
        }

        // Collect submissions for judge
        const submissions: PlayerSubmission[] = [];

        for (const player of game.players.values()) {
            if (player.photoPath) {
                submissions.push({
                    playerId: player.id,
                    playerName: player.name,
                    photoLocation: player.photoPath,
                });
            }
        }

        if (submissions.length === 0) {
            // No valid submissions, skip judging
            console.log('No submissions for this round');
            game.status = 'results';
            return null;
        }

        try {
            const judgeInput: JudgeRoundInput = {
                theme: currentBlank.theme,
                criteria: currentBlank.criteria,
                submissions,
            };

            const result: RoundResult = await judgeRound(judgeInput);

            // Find the winner
            const winner = game.players.get(result.winnerPlayerId);
            const winnerSubmission = submissions.find(s => s.playerId === result.winnerPlayerId);

            if (!winner || !winnerSubmission) {
                console.error('Winner not found in game state');
                game.status = 'results';
                return null;
            }

            // Increment winner's win count
            winner.winCount++;

            // Store this round's result
            const roundResult: RoundResultData = {
                blankIndex: currentBlank.index,
                winnerId: result.winnerPlayerId,
                winnerName: winner.name,
                photoPath: winnerSubmission.photoLocation,
                objectName: result.bestWord,
                oneliner: result.oneLiner,
            };

            game.results.push(roundResult);
            game.status = 'results';

            return roundResult;
        } catch (err) {
            console.error('Judge service error:', err);
            game.status = 'results';
            return null;
        }
    }

    /**
     * Advance to the next round or complete the game
     */
    nextRound(lobbyCode: string): GameState | null {
        const game = this.games.get(lobbyCode);
        if (!game) return null;

        if (game.currentRound >= game.totalRounds) {
            game.status = 'complete';
            return game;
        }

        // Reset player states for next round
        for (const player of game.players.values()) {
            player.hasSubmitted = false;
            if ('photoPath' in player) {
                delete (player as { photoPath?: string }).photoPath;
            }
        }

        game.currentRound++;
        game.roundDeadline = Date.now() + (game.roundTimeSeconds * 1000);
        game.status = 'round';

        this.resetNextRoundReady(lobbyCode);
        this.startRoundTimer(lobbyCode);

        return game;
    }

    /**
     * Get current game state
     */
    getGame(lobbyCode: string): GameState | undefined {
        return this.games.get(lobbyCode);
    }

    /**
     * Get game start payload
     */
    getGameStartPayload(game: GameState): GameStartPayload {
        return {
            storyTemplate: game.story.storyTemplate,
            blanks: game.story.blanks,
            totalRounds: game.totalRounds,
        };
    }

    /**
     * Get round payload for broadcast
     */
    getRoundPayload(game: GameState): RoundPayload {
        const blank = this.getCurrentBlank(game);
        return {
            round: game.currentRound,
            totalRounds: game.totalRounds,
            theme: blank?.theme ?? 'Find something',
            criteria: blank?.criteria ?? 'Something interesting',
            deadline: game.roundDeadline,
            remainingSeconds: Math.max(0, Math.ceil((game.roundDeadline - Date.now()) / 1000)),
        };
    }

    /**
     * Get round result payload for broadcast
     */
    getRoundResultPayload(result: RoundResultData, round: number): RoundResultPayload {
        return {
            round,
            winnerId: result.winnerId,
            winnerName: result.winnerName,
            photoPath: result.photoPath,
            objectName: result.objectName,
            oneliner: result.oneliner,
        };
    }

    /**
     * Get game complete payload with AI-generated recap
     * @param trollName - Name of the "Most Clueless" player to feature in the story
     */
    async getGameCompletePayload(game: GameState, trollName: string): Promise<GameCompletePayload> {
        // Build BlankResult array from round results
        const blankResults: BlankResult[] = game.results.map(r => ({
            index: r.blankIndex,
            bestWord: r.objectName,
        }));

        try {
            // Call recap service for AI-generated story
            const recap = await generateRecap({
                story: game.story.storyTemplate,
                trollName,
                results: blankResults,
            });

            return {
                storyTemplate: game.story.storyTemplate,
                results: game.results,
                segments: recap.segments,
                finalStory: recap.finalStory,
            };
        } catch (err) {
            console.error('Recap generation failed:', err);
            // Fallback: return without AI recap
            return {
                storyTemplate: game.story.storyTemplate,
                results: game.results,
                segments: [],
                finalStory: game.story.storyTemplate, // Use template as fallback
            };
        }
    }

    /**
     * Calculate and get final awards
     */
    getFinalAwardsPayload(game: GameState): FinalAwardsPayload {
        const players = Array.from(game.players.values());

        // Find max and min win counts
        const maxWins = Math.max(...players.map(p => p.winCount));
        const minWins = Math.min(...players.map(p => p.winCount));

        // Judge's Favorite: pick ONE player with most wins (random if tied)
        const favoritePool = players.filter(p => p.winCount === maxWins && maxWins > 0);
        const favorite = favoritePool.length > 0
            ? favoritePool[Math.floor(Math.random() * favoritePool.length)]
            : null;
        const judgesFavorite = favorite
            ? { playerId: favorite.id, name: favorite.name, wins: favorite.winCount }
            : null;

        // Most Clueless: pick ONE player with fewest wins (random if tied)
        const cluelessPool = players.filter(p => p.winCount === minWins && minWins < maxWins);
        const clueless = cluelessPool.length > 0
            ? cluelessPool[Math.floor(Math.random() * cluelessPool.length)]
            : null;
        const mostClueless = clueless
            ? { playerId: clueless.id, name: clueless.name, wins: clueless.winCount }
            : null;

        return { judgesFavorite, mostClueless };
    }

    /**
     * Clean up a game
     */
    endGame(lobbyCode: string): void {
        this.clearTimers(lobbyCode);
        this.games.delete(lobbyCode);
        this.nextRoundReady.delete(lobbyCode);
    }

    /**
     * Handle player disconnect
     */
    handleDisconnect(lobbyCode: string, playerId: string): void {
        const game = this.games.get(lobbyCode);
        if (!game) return;

        // Mark player as having submitted (empty) so they don't block the round
        const player = game.players.get(playerId);
        if (player && !player.hasSubmitted) {
            player.hasSubmitted = true;
        }

        // Check if all remaining connected players have submitted
        if (this.allPlayersSubmitted(lobbyCode)) {
            this.tryEndRound(lobbyCode);
        }
    }

    /**
     * Handle player rejoin - update socket ID in game state
     */
    handleRejoin(lobbyCode: string, oldSocketId: string, newSocketId: string): boolean {
        const game = this.games.get(lobbyCode);
        if (!game) return false;

        const player = game.players.get(oldSocketId);
        if (!player) return false;

        // Update player ID in game state
        game.players.delete(oldSocketId);
        player.id = newSocketId;
        game.players.set(newSocketId, player);

        return true;
    }
}

// Export singleton instance
export const gameManager = new GameManager();
