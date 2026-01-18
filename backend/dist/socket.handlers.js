/**
 * Socket.io Event Handlers for IRL Quests
 *
 * Handles all real-time events for lobby and game management.
 * Updated for story-based game flow.
 *
 * ============================================================================
 * EVENT REFERENCE
 * ============================================================================
 *
 * CLIENT -> SERVER (emit):
 * - lobby:create   { name }                   Create a new lobby as host
 * - lobby:join     { code, name }             Join existing lobby by code
 * - lobby:leave    (no payload)               Leave current lobby
 * - lobby:ready    { ready: boolean }         Toggle ready status
 * - lobby:settings { rounds?, roundTimeSeconds? }  Update game settings (host only)
 * - lobby:start    (no payload)               Start the game (host only)
 * - game:submit    { photoPath }              Submit photo for current round
 * - game:next-round-ready (no payload)        Confirm ready to continue after results
 *
 * SERVER -> CLIENT (on):
 * - lobby:state        Full lobby state with players and settings
 * - lobby:player-joined  New player joined notification
 * - lobby:player-left    Player left notification
 * - lobby:host-changed   Host changed notification (host left)
 * - lobby:error          Error message
 * - game:start           Game started with story template and blanks
 * - game:round           Current round's theme and criteria
 * - game:tick            Timer countdown (seconds remaining)
 * - game:player-submitted  Player submitted their photo
 * - game:judging         AI is judging submissions
 * - game:round-result    Round winner with photo and one-liner
 * - game:next-round-status  Ready count for next round
 * - game:complete        Story complete with all results
 * - game:awards          Final awards (Judge's Favorite, Most Clueless)
 * - game:error           Game error message
 * ============================================================================
 */
import { lobbyManager } from './service/lobby.manager.js';
import { gameManager } from './service/game.manager.js';
// ============================================================================
// Socket Handler Setup
// ============================================================================
export function setupSocketHandlers(io) {
    // Set up game manager callbacks for timer events
    gameManager.setCallbacks({
        onTick: (lobbyCode, remainingSeconds) => {
            io.to(lobbyCode).emit('game:tick', { remainingSeconds });
        },
        onRoundEnd: async (lobbyCode) => {
            await handleRoundEnd(io, lobbyCode);
        },
    });
    io.on('connection', (socket) => {
        console.log(`Player connected: ${socket.id}`);
        // ========================================================================
        // Lobby Events
        // ========================================================================
        /**
         * lobby:create - Create a new lobby
         * @param {string} name - Player's display name
         * @emits lobby:state - Full lobby state to the creator
         * @emits lobby:error - If name is missing
         */
        socket.on('lobby:create', (payload) => {
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
            }
            catch (err) {
                socket.emit('lobby:error', { message: err.message });
            }
        });
        /**
         * lobby:join - Join an existing lobby (or rejoin if disconnected)
         * @param {string} code - 4-character lobby code
         * @param {string} name - Player's display name
         * @emits lobby:state - Full lobby state to all players in lobby
         * @emits lobby:player-joined - Notification to other players (new join)
         * @emits lobby:player-rejoined - Notification to other players (rejoin)
         * @emits game:round - Current round info if rejoining game in progress
         * @emits lobby:error - If lobby not found, full, or game in progress (for new players)
         */
        socket.on('lobby:join', (payload) => {
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
                const trimmedCode = code.trim().toUpperCase();
                const trimmedName = name.trim();
                // First, try to rejoin as a disconnected player
                const rejoinResult = lobbyManager.rejoinLobby(trimmedCode, socket.id, trimmedName);
                if (rejoinResult) {
                    // Rejoining as disconnected player
                    const { lobby, oldSocketId } = rejoinResult;
                    socket.join(lobby.code);
                    // Update game state if game in progress
                    const game = gameManager.getGame(lobby.code);
                    if (game) {
                        gameManager.handleRejoin(lobby.code, oldSocketId, socket.id);
                        // Send current game state
                        const roundPayload = gameManager.getRoundPayload(game);
                        socket.emit('game:round', roundPayload);
                    }
                    // Send lobby state
                    const state = lobbyManager.toLobbyState(lobby);
                    socket.emit('lobby:state', state);
                    // Notify others about rejoin
                    socket.to(lobby.code).emit('lobby:player-rejoined', {
                        playerId: socket.id,
                        playerName: trimmedName,
                    });
                    console.log(`${trimmedName} rejoined lobby ${lobby.code}`);
                    return;
                }
                // Not a rejoin - try normal join
                const lobby = lobbyManager.joinLobby(trimmedCode, socket.id, trimmedName);
                socket.join(lobby.code);
                const state = lobbyManager.toLobbyState(lobby);
                // Notify all players in lobby
                io.to(lobby.code).emit('lobby:state', state);
                // Notify others about new player
                socket.to(lobby.code).emit('lobby:player-joined', {
                    player: { id: socket.id, name: trimmedName },
                });
                console.log(`${trimmedName} joined lobby ${lobby.code}`);
            }
            catch (err) {
                socket.emit('lobby:error', { message: err.message });
            }
        });
        /**
         * lobby:leave - Leave the current lobby
         * @emits lobby:state - Updated state to remaining players
         * @emits lobby:player-left - Notification to remaining players
         */
        //TODO: Different Approach
        socket.on('lobby:leave', () => {
            handlePlayerLeave(io, socket);
        });
        /**
         * lobby:ready - Toggle ready status
         * @param {boolean} ready - Ready state
         * @emits lobby:state - Updated state to all players
         */
        socket.on('lobby:ready', (payload) => {
            try {
                const { ready } = payload;
                const lobby = lobbyManager.setReady(socket.id, ready);
                const state = lobbyManager.toLobbyState(lobby);
                io.to(lobby.code).emit('lobby:state', state);
            }
            catch (err) {
                socket.emit('lobby:error', { message: err.message });
            }
        });
        /**
         * lobby:settings - Update game settings (host only)
         * @param {number} rounds - Number of rounds (1-8)
         * @param {number} roundTimeSeconds - Time per round in seconds (30-120)
         * @emits lobby:state - Updated state with new settings to all players
         * @emits lobby:error - If not host or game already started
         */
        socket.on('lobby:settings', (payload) => {
            try {
                const lobby = lobbyManager.updateSettings(socket.id, payload);
                const state = lobbyManager.toLobbyState(lobby);
                io.to(lobby.code).emit('lobby:state', state);
            }
            catch (err) {
                socket.emit('lobby:error', { message: err.message });
            }
        });
        /**
         * lobby:start - Start the game (host only)
         * Requires: all players ready, at least 2 players
         * @emits game:start - Story template and all blanks
         * @emits game:round - First round's theme and criteria
         * @emits lobby:error - If conditions not met
         */
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
                // Start the game (async due to story generation)
                const game = await gameManager.startGame(lobby);
                // Send game start with story info
                const startPayload = gameManager.getGameStartPayload(game);
                io.to(lobbyCode).emit('game:start', startPayload);
                // Also send first round info
                const roundPayload = gameManager.getRoundPayload(game);
                io.to(lobbyCode).emit('game:round', roundPayload);
                console.log(`Game started in lobby ${lobbyCode} with ${game.totalRounds} rounds`);
            }
            catch (err) {
                socket.emit('lobby:error', { message: err.message });
            }
        });
        // ========================================================================
        // Game Events
        // ========================================================================
        /**
         * game:submit - Submit a photo for the current round
         * @param {string} photoPath - Path to uploaded photo (from /upload endpoint)
         * @emits game:player-submitted - Notification to all players
         * @emits game:error - If submission fails or past deadline
         */
        socket.on('game:submit', (payload) => {
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
                }
                else {
                    socket.emit('game:error', { message: 'Could not submit photo' });
                }
            }
            catch (err) {
                socket.emit('game:error', { message: err.message });
            }
        });
        socket.on('game:reaction', ({ icon }) => {
            const lobbyCode = lobbyManager.getPlayerLobby(socket.id);
            if (!lobbyCode) {
                socket.emit('game:error', { message: 'Not in a game' });
                return;
            }
            socket.to(lobbyCode).emit('game:reaction', {
                playerId: socket.id,
                icon
            });
        });
        /**
         * game:next-round-ready - Player confirms ready to proceed after results
         * Once all players confirm, server emits next `game:round` (or `game:complete` if final).
         * @emits game:next-round-status - Ready count update
         * @emits game:round - Next round info (when all ready)
         * @emits game:complete - Completed story (if final round and all ready)
         * @emits game:awards - Final awards (if final round and all ready)
         */
        socket.on('game:next-round-ready', async () => {
            try {
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
                if (game.status !== 'results') {
                    socket.emit('game:error', { message: 'Not ready to continue yet' });
                    return;
                }
                gameManager.setPlayerReadyForNextRound(lobbyCode, socket.id);
                await maybeAdvanceAfterResults(io, lobbyCode);
            }
            catch (err) {
                socket.emit('game:error', { message: err.message });
            }
        });
        // ========================================================================
        // Disconnect
        // ========================================================================
        /**
         * disconnect - Handle player disconnection
         * During game: marks as disconnected (can rejoin)
         * In lobby: fully removes player
         */
        socket.on('disconnect', () => {
            console.log(`Player disconnected: ${socket.id}`);
            const lobbyCode = lobbyManager.getPlayerLobby(socket.id);
            if (!lobbyCode)
                return;
            const lobby = lobbyManager.getLobby(lobbyCode);
            const game = gameManager.getGame(lobbyCode);
            if (game && lobby?.status === 'in-game') {
                // Game in progress - mark as disconnected, allow rejoin
                gameManager.handleDisconnect(lobbyCode, socket.id);
                const result = lobbyManager.markDisconnected(socket.id);
                if (result?.lobby) {
                    const state = lobbyManager.toLobbyState(result.lobby);
                    io.to(lobbyCode).emit('lobby:state', state);
                    io.to(lobbyCode).emit('lobby:player-disconnected', {
                        playerId: socket.id,
                        playerName: result.playerName,
                    });
                    console.log(`${result.playerName} disconnected from game (can rejoin)`);
                }
            }
            else {
                // Not in game - fully remove
                handlePlayerLeave(io, socket);
            }
        });
    });
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Handle player leaving lobby
 * Removes player, migrates host if needed, notifies remaining players
 */
function handlePlayerLeave(io, socket) {
    const result = lobbyManager.leaveLobby(socket.id);
    if (!result)
        return;
    const { lobby, code } = result;
    socket.leave(code);
    // Keep game state in sync if someone leaves mid-game/results
    const game = gameManager.getGame(code);
    if (game) {
        gameManager.removePlayerFromGame(code, socket.id);
        if (game.status === 'results') {
            void maybeAdvanceAfterResults(io, code);
        }
    }
    if (lobby) {
        const state = lobbyManager.toLobbyState(lobby);
        io.to(code).emit('lobby:state', state);
        io.to(code).emit('lobby:player-left', { playerId: socket.id });
        if (result.wasHost) {
            io.to(code).emit('lobby:host-changed', { code, hostId: lobby.hostId, previousHostId: socket.id });
        }
    }
}
/**
 * Handle end of a round
 * Triggers AI judging, picks winner, shows results, advances to next round
 * @emits game:judging - While AI is processing
 * @emits game:round-result - Winner info with one-liner
 * @emits game:round - Next round info (if more rounds)
 * @emits game:complete - Completed story (if final round)
 * @emits game:awards - Final awards (if final round)
 */
async function handleRoundEnd(io, lobbyCode) {
    const game = gameManager.getGame(lobbyCode);
    if (!game)
        return;
    // Notify players judging is starting
    io.to(lobbyCode).emit('game:judging');
    // Run AI judge - returns single winner
    const result = await gameManager.judgeRound(lobbyCode);
    if (result) {
        const resultsPayload = gameManager.getRoundResultPayload(result, game.currentRound);
        io.to(lobbyCode).emit('game:round-result', resultsPayload);
    }
    else {
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
    // Reset readiness and notify clients we are waiting for confirmations
    gameManager.resetNextRoundReady(lobbyCode);
    io.to(lobbyCode).emit('game:next-round-status', { readyCount: 0, totalPlayers: game.players.size });
}
async function maybeAdvanceAfterResults(io, lobbyCode) {
    const game = gameManager.getGame(lobbyCode);
    if (!game)
        return;
    if (game.status !== 'results')
        return;
    const { readyCount, totalPlayers, allReady } = gameManager.getNextRoundReadyStatus(lobbyCode);
    io.to(lobbyCode).emit('game:next-round-status', { readyCount, totalPlayers });
    if (!allReady)
        return;
    const nextGame = gameManager.nextRound(lobbyCode);
    if (!nextGame)
        return;
    if (nextGame.status === 'complete') {
        const awardsPayload = gameManager.getFinalAwardsPayload(nextGame);
        const trollName = awardsPayload.mostClueless[0]?.name ?? 'The Adventurer';
        const completePayload = await gameManager.getGameCompletePayload(nextGame, trollName);
        io.to(lobbyCode).emit('game:complete', completePayload);
        io.to(lobbyCode).emit('game:awards', awardsPayload);
        gameManager.endGame(lobbyCode);
        console.log(`Game completed in lobby ${lobbyCode}`);
    }
    else {
        const roundPayload = gameManager.getRoundPayload(nextGame);
        io.to(lobbyCode).emit('game:round', roundPayload);
    }
}
//# sourceMappingURL=socket.handlers.js.map