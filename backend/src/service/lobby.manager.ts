/**
 * LobbyManager - In-memory lobby state management
 */

import type { Lobby, Player, LobbyStatePayload, GameSettings } from '../lib/types/types.js';
import { DEFAULT_GAME_SETTINGS } from '../lib/types/types.js';

// ============================================================================
// Lobby Manager Class
// ============================================================================

export class LobbyManager {
    private lobbies: Map<string, Lobby> = new Map();
    private playerToLobby: Map<string, string> = new Map(); // socketId -> lobbyCode

    /**
     * Generate a random 4-character lobby code
     */
    private generateCode(): string {
        const chars = '0123456789'; // No confusing chars (0/O, 1/I)
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Ensure unique
        if (this.lobbies.has(code)) {
            return this.generateCode();
        }
        return code;
    }

    /**
     * Create a new lobby with the given host
     */
    createLobby(hostSocketId: string, hostName: string): Lobby {
        const code = this.generateCode();

        const host: Player = {
            id: hostSocketId,
            name: hostName,
            isHost: true,
            isReady: false,
            isConnected: true,
        };

        const lobby: Lobby = {
            code,
            players: new Map([[hostSocketId, host]]),
            hostId: hostSocketId,
            status: 'waiting',
            maxPlayers: 8,
            createdAt: Date.now(),
            settings: { ...DEFAULT_GAME_SETTINGS },
        };

        this.lobbies.set(code, lobby);
        this.playerToLobby.set(hostSocketId, code);

        return lobby;
    }

    /**
     * Join an existing lobby
     */
    joinLobby(code: string, socketId: string, playerName: string): Lobby {
        const lobby = this.lobbies.get(code.toUpperCase());

        if (!lobby) {
            throw new Error('Lobby not found');
        }

        if (lobby.status !== 'waiting') {
            throw new Error('Game already in progress');
        }

        if (lobby.players.size >= lobby.maxPlayers) {
            throw new Error('Lobby is full');
        }

        if (this.playerToLobby.has(socketId)) {
            throw new Error('Already in a lobby');
        }

        const player: Player = {
            id: socketId,
            name: playerName,
            isHost: false,
            isReady: false,
            isConnected: true,
        };

        lobby.players.set(socketId, player);
        this.playerToLobby.set(socketId, code);

        return lobby;
    }

    /**
     * Remove a player from their lobby
     * Returns the updated lobby, or null if lobby was deleted
     */
    leaveLobby(socketId: string): { lobby: Lobby | null; wasHost: boolean; code: string } | null {
        const code = this.playerToLobby.get(socketId);
        if (!code) {
            return null;
        }

        const lobby = this.lobbies.get(code);
        if (!lobby) {
            this.playerToLobby.delete(socketId);
            return null;
        }

        const wasHost = lobby.hostId === socketId;
        lobby.players.delete(socketId);
        this.playerToLobby.delete(socketId);

        // If lobby is empty, delete it
        if (lobby.players.size === 0) {
            this.lobbies.delete(code);
            return { lobby: null, wasHost, code };
        }

        // If host left, assign new host to first remaining player
        if (wasHost) {
            const newHost = lobby.players.values().next().value;
            if (newHost) {
                newHost.isHost = true;
                lobby.hostId = newHost.id;
            }
        }

        return { lobby, wasHost, code };
    }

    /**
     * Mark a player as disconnected (don't remove during game)
     * Allows rejoin by name within the same lobby
     */
    markDisconnected(socketId: string): { lobby: Lobby | null; code: string; playerName: string } | null {
        const code = this.playerToLobby.get(socketId);
        if (!code) return null;

        const lobby = this.lobbies.get(code);
        if (!lobby) {
            this.playerToLobby.delete(socketId);
            return null;
        }

        const player = lobby.players.get(socketId);
        if (!player) return null;

        const playerName = player.name;

        // If game is in progress, just mark as disconnected
        if (lobby.status === 'in-game') {
            player.isConnected = false;
            this.playerToLobby.delete(socketId);
            return { lobby, code, playerName };
        }

        // If waiting, fully remove (use leaveLobby)
        this.leaveLobby(socketId);
        return { lobby, code, playerName };
    }

    /**
     * Rejoin a lobby by name (for reconnecting players)
     * Returns the player's previous state if found
     */
    rejoinLobby(code: string, newSocketId: string, playerName: string): { lobby: Lobby; oldSocketId: string } | null {
        const lobby = this.lobbies.get(code.toUpperCase());
        if (!lobby) return null;

        // Find disconnected player with matching name
        for (const [oldSocketId, player] of lobby.players) {
            if (player.name === playerName && !player.isConnected) {
                // Update socket ID
                lobby.players.delete(oldSocketId);
                player.id = newSocketId;
                player.isConnected = true;
                lobby.players.set(newSocketId, player);
                this.playerToLobby.set(newSocketId, code);

                return { lobby, oldSocketId };
            }
        }

        return null; // No matching disconnected player
    }

    /**
     * Set a player's ready status
     */
    setReady(socketId: string, ready: boolean): Lobby {
        const code = this.playerToLobby.get(socketId);
        if (!code) {
            throw new Error('Not in a lobby');
        }

        const lobby = this.lobbies.get(code);
        if (!lobby) {
            throw new Error('Lobby not found');
        }

        const player = lobby.players.get(socketId);
        if (!player) {
            throw new Error('Player not found');
        }

        player.isReady = ready;
        return lobby;
    }

    /**
     * Check if all players are ready
     */
    allPlayersReady(code: string): boolean {
        const lobby = this.lobbies.get(code);
        if (!lobby || lobby.players.size < 2) {
            return false;
        }

        for (const player of lobby.players.values()) {
            if (!player.isReady) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get a lobby by code
     */
    getLobby(code: string): Lobby | undefined {
        return this.lobbies.get(code.toUpperCase());
    }

    /**
     * Get lobby code for a player
     */
    getPlayerLobby(socketId: string): string | undefined {
        return this.playerToLobby.get(socketId);
    }

    /**
     * Mark lobby as in-game
     */
    setLobbyInGame(code: string): void {
        const lobby = this.lobbies.get(code);
        if (lobby) {
            lobby.status = 'in-game';
        }
    }

    /**
     * Update lobby settings (host only)
     */
    updateSettings(socketId: string, settings: Partial<GameSettings>): Lobby {
        const code = this.playerToLobby.get(socketId);
        if (!code) {
            throw new Error('Not in a lobby');
        }

        const lobby = this.lobbies.get(code);
        if (!lobby) {
            throw new Error('Lobby not found');
        }

        if (lobby.hostId !== socketId) {
            throw new Error('Only the host can change settings');
        }

        if (lobby.status !== 'waiting') {
            throw new Error('Cannot change settings after game started');
        }

        // Validate and apply settings
        if (settings.rounds !== undefined) {
            lobby.settings.rounds = Math.max(3, Math.min(6, settings.rounds));
        }
        if (settings.roundTimeSeconds !== undefined) {
            lobby.settings.roundTimeSeconds = Math.max(15, Math.min(60, settings.roundTimeSeconds));
        }

        return lobby;
    }

    /**
     * Convert lobby to broadcastable payload
     */
    toLobbyState(lobby: Lobby): LobbyStatePayload {
        const players = Array.from(lobby.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isReady: p.isReady,
            isConnected: p.isConnected,
        }));

        return {
            code: lobby.code,
            players,
            hostId: lobby.hostId,
            status: lobby.status,
            allReady: this.allPlayersReady(lobby.code),
            settings: lobby.settings,
        };
    }
}

// Export singleton instance
export const lobbyManager = new LobbyManager();
