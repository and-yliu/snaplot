/**
 * LobbyManager - In-memory lobby state management
 */
import type { Lobby, LobbyStatePayload, GameSettings } from '../lib/types/types.js';
export declare class LobbyManager {
    private lobbies;
    private playerToLobby;
    /**
     * Generate a random 4-character lobby code
     */
    private generateCode;
    /**
     * Create a new lobby with the given host
     */
    createLobby(hostSocketId: string, hostName: string): Lobby;
    /**
     * Join an existing lobby
     */
    joinLobby(code: string, socketId: string, playerName: string): Lobby;
    /**
     * Remove a player from their lobby
     * Returns the updated lobby, or null if lobby was deleted
     */
    leaveLobby(socketId: string): {
        lobby: Lobby | null;
        wasHost: boolean;
        code: string;
    } | null;
    /**
     * Mark a player as disconnected (don't remove during game)
     * Allows rejoin by name within the same lobby
     */
    markDisconnected(socketId: string): {
        lobby: Lobby | null;
        code: string;
        playerName: string;
    } | null;
    /**
     * Rejoin a lobby by name (for reconnecting players)
     * Returns the player's previous state if found
     */
    rejoinLobby(code: string, newSocketId: string, playerName: string): {
        lobby: Lobby;
        oldSocketId: string;
    } | null;
    /**
     * Set a player's ready status
     */
    setReady(socketId: string, ready: boolean): Lobby;
    /**
     * Check if all players are ready
     */
    allPlayersReady(code: string): boolean;
    /**
     * Get a lobby by code
     */
    getLobby(code: string): Lobby | undefined;
    /**
     * Get lobby code for a player
     */
    getPlayerLobby(socketId: string): string | undefined;
    /**
     * Mark lobby as in-game
     */
    setLobbyInGame(code: string): void;
    /**
     * Update lobby settings (host only)
     */
    updateSettings(socketId: string, settings: Partial<GameSettings>): Lobby;
    /**
     * Convert lobby to broadcastable payload
     */
    toLobbyState(lobby: Lobby): LobbyStatePayload;
}
export declare const lobbyManager: LobbyManager;
//# sourceMappingURL=lobby.manager.d.ts.map