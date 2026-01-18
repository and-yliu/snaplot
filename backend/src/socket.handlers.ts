/**
 * Socket.io Event Handlers for IRL Quests
 * 
 * Handles all real-time events for lobby and game management.
 * Updated for story-based game flow.
 */

import type { Server, Socket } from 'socket.io';
import { lobbyManager } from './service/lobby.manager.js';
import { gameManager } from './service/game.manager.js';
import type {
    CreateLobbyPayload,
    JoinLobbyPayload,
    ReadyPayload,
    SubmitPhotoPayload,
} from './lib/types/types.js';

// ============================================================================
// Socket Handler Setup
// ============================================================================

export function setupSocketHandlers(io: Server): void {
    // Set up game manager callbacks for timer events
    gameManager.setCallbacks({
        onTick: (lobbyCode, remainingSeconds) => {
            io.to(lobbyCode).emit('game:tick', { remainingSeconds });
        },
        onRoundEnd: async (lobbyCode) => {
            await handleRoundEnd(io, lobbyCode);
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Player connected: ${socket.id}`);

        // ========================================================================
        // Lobby Events
        // ========================================================================

        socket.on('lobby:create', (payload: CreateLobbyPayload) => {
            try {
                const { name } = payload;

                if (!name || name.trim().length === 0) {
                    socket.emit('lobby:error', { message: 'Name is required' });
                    return;
                }

                const lobby = lobbyManager.createLobby(socket.id, name.trim());
                socket.join(lobby.code);

                const state = lobbyManager.toLobbyState(lobby);
                socket.emit('lobby:state', state);

                console.log(`Lobby ${lobby.code} created by ${name}`);
            } catch (err) {
                socket.emit('lobby:error', { message: (err as Error).message });
            }
        });

        socket.on('lobby:join', (payload: JoinLobbyPayload) => {
            try {
                const { code, name } = payload;

                if (!name || name.trim().length === 0) {
                    socket.emit('lobby:error', { message: 'Name is required' });
                    return;
                }

                if (!code || code.trim().length === 0) {
                    socket.emit('lobby:error', { message: 'Lobby code is required' });
                    return;
                }

                const lobby = lobbyManager.joinLobby(code.trim().toUpperCase(), socket.id, name.trim());
                socket.join(lobby.code);

                const state = lobbyManager.toLobbyState(lobby);

                // Notify all players in lobby
                io.to(lobby.code).emit('lobby:state', state);

                // Notify others about new player
                socket.to(lobby.code).emit('lobby:player-joined', {
                    player: { id: socket.id, name: name.trim() },
                });

                console.log(`${name} joined lobby ${lobby.code}`);
            } catch (err) {
                socket.emit('lobby:error', { message: (err as Error).message });
            }
        });

        socket.on('lobby:leave', () => {
            handlePlayerLeave(io, socket);
        });

        socket.on('lobby:ready', (payload: ReadyPayload) => {
            try {
                const { ready } = payload;
                const lobby = lobbyManager.setReady(socket.id, ready);

                const state = lobbyManager.toLobbyState(lobby);
                io.to(lobby.code).emit('lobby:state', state);
            } catch (err) {
                socket.emit('lobby:error', { message: (err as Error).message });
            }
        });

        socket.on('lobby:start', async () => {
            try {
                const lobbyCode = lobbyManager.getPlayerLobby(socket.id);
                if (!lobbyCode) {
                    socket.emit('lobby:error', { message: 'Not in a lobby' });
                    return;
                }

                const lobby = lobbyManager.getLobby(lobbyCode);
                if (!lobby) {
                    socket.emit('lobby:error', { message: 'Lobby not found' });
                    return;
                }

                if (lobby.hostId !== socket.id) {
                    socket.emit('lobby:error', { message: 'Only the host can start the game' });
                    return;
                }

                if (!lobbyManager.allPlayersReady(lobbyCode)) {
                    socket.emit('lobby:error', { message: 'Not all players are ready' });
                    return;
                }

                if (lobby.players.size < 2) {
                    socket.emit('lobby:error', { message: 'Need at least 2 players to start' });
                    return;
                }

                // Mark lobby as in-game
                lobbyManager.setLobbyInGame(lobbyCode);

                // Start the game (async now due to story generation)
                const game = await gameManager.startGame(lobby);

                // Send game start with story info
                const startPayload = gameManager.getGameStartPayload(game);
                io.to(lobbyCode).emit('game:start', startPayload);

                // Also send first round info
                const roundPayload = gameManager.getRoundPayload(game);
                io.to(lobbyCode).emit('game:round', roundPayload);

                console.log(`Game started in lobby ${lobbyCode} with ${game.totalRounds} rounds`);
            } catch (err) {
                socket.emit('lobby:error', { message: (err as Error).message });
            }
        });

        // ========================================================================
        // Game Events
        // ========================================================================

        socket.on('game:submit', (payload: SubmitPhotoPayload) => {
            try {
                const { photoPath } = payload;
                const lobbyCode = lobbyManager.getPlayerLobby(socket.id);

                if (!lobbyCode) {
                    socket.emit('game:error', { message: 'Not in a game' });
                    return;
                }

                const game = gameManager.getGame(lobbyCode);
                if (!game) {
                    socket.emit('game:error', { message: 'Game not found' });
                    return;
                }

                const submitted = gameManager.submitPhoto(lobbyCode, socket.id, photoPath);

                if (submitted) {
                    const player = game.players.get(socket.id);
                    io.to(lobbyCode).emit('game:player-submitted', {
                        playerId: socket.id,
                        playerName: player?.name ?? 'Unknown',
                    });
                } else {
                    socket.emit('game:error', { message: 'Could not submit photo' });
                }
            } catch (err) {
                socket.emit('game:error', { message: (err as Error).message });
            }
        });

        // ========================================================================
        // Disconnect
        // ========================================================================

        socket.on('disconnect', () => {
            console.log(`Player disconnected: ${socket.id}`);

            // Handle game disconnect
            const lobbyCode = lobbyManager.getPlayerLobby(socket.id);
            if (lobbyCode) {
                const game = gameManager.getGame(lobbyCode);
                if (game) {
                    gameManager.handleDisconnect(lobbyCode, socket.id);
                }
            }

            // Handle lobby disconnect
            handlePlayerLeave(io, socket);
        });
    });
}

// ============================================================================
// Helper Functions
// ============================================================================

function handlePlayerLeave(io: Server, socket: Socket): void {
    const result = lobbyManager.leaveLobby(socket.id);

    if (!result) return;

    const { lobby, code } = result;

    socket.leave(code);

    if (lobby) {
        const state = lobbyManager.toLobbyState(lobby);
        io.to(code).emit('lobby:state', state);
        io.to(code).emit('lobby:player-left', { playerId: socket.id });
    }
}

async function handleRoundEnd(io: Server, lobbyCode: string): Promise<void> {
    const game = gameManager.getGame(lobbyCode);
    if (!game) return;

    // Notify players judging is starting
    io.to(lobbyCode).emit('game:judging');

    // Run AI judge - now returns single winner
    const result = await gameManager.judgeRound(lobbyCode);

    if (result) {
        const resultsPayload = gameManager.getRoundResultPayload(result, game.currentRound);
        io.to(lobbyCode).emit('game:round-result', resultsPayload);
    } else {
        // No submissions or error - send empty result
        io.to(lobbyCode).emit('game:round-result', {
            round: game.currentRound,
            winnerId: null,
            winnerName: null,
            photoPath: null,
            objectName: null,
            oneliner: 'No submissions this round!',
        });
    }

    // Wait for players to see results, then advance
    setTimeout(() => {
        const currentGame = gameManager.getGame(lobbyCode);
        if (!currentGame) return;

        // Advance to next round or complete game
        const nextGame = gameManager.nextRound(lobbyCode);
        if (!nextGame) return;

        if (nextGame.status === 'complete') {
            // Game over - send complete story and awards
            const completePayload = gameManager.getGameCompletePayload(nextGame);
            io.to(lobbyCode).emit('game:complete', completePayload);

            const awardsPayload = gameManager.getFinalAwardsPayload(nextGame);
            io.to(lobbyCode).emit('game:awards', awardsPayload);

            gameManager.endGame(lobbyCode);
            console.log(`Game completed in lobby ${lobbyCode}`);
        } else {
            // Send next round info
            const roundPayload = gameManager.getRoundPayload(nextGame);
            io.to(lobbyCode).emit('game:round', roundPayload);
        }
    }, 8000); // 8 seconds to view results
}
