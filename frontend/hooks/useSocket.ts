/**
 * Socket.IO Hook for IRL Quests
 * 
 * Provides a singleton socket connection and lobby state management.
 * Uses module-level state that persists across component instances.
 */

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { io, Socket } from 'socket.io-client';

// Types matching backend
export interface Player {
    id: string;
    name: string;
    isReady: boolean;
    isHost?: boolean;
}

export interface LobbyState {
    code: string;
    hostId: string;
    players: Player[];
    settings: {
        rounds: number;
        roundTimeSeconds: number;
    };
    inGame: boolean;
}

export interface GameStartPayload {
    storyTemplate: string;
    blanks: Array<{
        index: number;
        theme: string;
        criteria: string;
    }>;
    totalRounds: number;
}

export interface RoundPayload {
    round: number;
    theme: string;
    criteria: string;
    totalRounds: number;
    deadline?: number;
    remainingSeconds?: number;
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

export interface NextRoundStatusPayload {
    readyCount: number;
    totalPlayers: number;
}

// Story segment from recap service
export interface StorySegment {
    index: number;
    lead: string;
}

// Game complete payload with AI recap
export interface GameCompletePayload {
    storyTemplate: string;
    results: RoundResultPayload[];
    segments: StorySegment[];
    finalStory: string;
}

// Final awards payload
export interface FinalAwardsPayload {
    judgesFavorite: { playerId: string; name: string; wins: number } | null;
    mostClueless: { playerId: string; name: string; wins: number } | null;
}

// Navigation types for pending navigation
export type PendingNavigation =
    | { type: 'host-waiting-room'; roomPin: string }
    | { type: 'player-waiting-room'; roomPin: string }
    | { type: 'loading' }
    | { type: 'game' }
    | { type: 'round-result' }
    | { type: 'story-result' }
    | null;

// Server URL - update this to your backend URL
export const SERVER_URL = 'http://10.19.130.64:3000';

// ============================================================================
// Global State Store (persists across component instances)
// ============================================================================

interface SocketState {
    isConnected: boolean;
    lobbyState: LobbyState | null;
    error: string | null;
    gameStart: GameStartPayload | null;
    currentRound: RoundPayload | null;
    tick: TickPayload | null;
    submittedPlayerIds: string[];
    isJudging: boolean;
    roundResult: RoundResultPayload | null;
    roundResultContext: RoundPayload | null;
    nextRoundStatus: NextRoundStatusPayload | null;
    pendingNavigation: PendingNavigation;
    remoteReactions: { id: string; icon: string; playerId: string }[];
    gameComplete: GameCompletePayload | null;
    awards: FinalAwardsPayload | null;
}

let globalState: SocketState = {
    isConnected: false,
    lobbyState: null,
    error: null,
    gameStart: null,
    currentRound: null,
    tick: null,
    submittedPlayerIds: [],
    isJudging: false,
    roundResult: null,
    roundResultContext: null,
    nextRoundStatus: null,
    pendingNavigation: null,
    remoteReactions: [],
    gameComplete: null,
    awards: null,
};

const listeners = new Set<() => void>();

function notifyListeners() {
    listeners.forEach(listener => listener());
}

function setGlobalState(updates: Partial<SocketState>) {
    globalState = { ...globalState, ...updates };
    notifyListeners();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return globalState;
}

// ============================================================================
// Singleton Socket Instance
// ============================================================================

type GlobalSingleton = {
    socket: Socket | null;
    isInitialized: boolean;
};

const globalSingleton = (() => {
    const g = globalThis as unknown as { __irlQuestsSocketSingleton?: GlobalSingleton };
    if (!g.__irlQuestsSocketSingleton) {
        g.__irlQuestsSocketSingleton = { socket: null, isInitialized: false };
    }
    return g.__irlQuestsSocketSingleton;
})();

let socketInstance: Socket | null = globalSingleton.socket;
let isInitialized = globalSingleton.isInitialized;

// Track pending action to determine navigation type
let pendingAction: 'create' | 'join' | null = null;

let lastRoundKey: string | null = null;
let lastRoundResultKey: string | null = null;

function getSocket(): Socket {
    if (!socketInstance) {
        socketInstance = io(SERVER_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });
        globalSingleton.socket = socketInstance;

        // Set up event listeners once
        if (!isInitialized) {
            isInitialized = true;
            globalSingleton.isInitialized = true;

            // Defensive: ensure we never accumulate duplicate listeners (e.g. Fast Refresh)
            socketInstance.off('connect');
            socketInstance.off('disconnect');
            socketInstance.off('lobby:state');
            socketInstance.off('lobby:error');
            socketInstance.off('lobby:player-joined');
            socketInstance.off('lobby:player-left');
            socketInstance.off('lobby:host-changed');
            socketInstance.off('game:loading');
            socketInstance.off('game:start');
            socketInstance.off('game:round');
            socketInstance.off('game:tick');
            socketInstance.off('game:player-submitted');
            socketInstance.off('game:judging');
            socketInstance.off('game:round-result');
            socketInstance.off('game:next-round-status');
            socketInstance.off('game:error');

            socketInstance.on('connect', () => {
                console.log('Socket connected:', socketInstance?.id);
                setGlobalState({ isConnected: true });
            });

            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
                setGlobalState({ isConnected: false });
            });

            socketInstance.on('lobby:state', (state: LobbyState) => {
                console.log('Lobby state received:', state);

                // Only set pending navigation on create/join, not on updates
                if (pendingAction && state.code) {
                    const navType = pendingAction === 'create'
                        ? 'host-waiting-room'
                        : 'player-waiting-room';
                    setGlobalState({
                        lobbyState: state,
                        error: null,
                        pendingNavigation: { type: navType, roomPin: state.code }
                    });
                    pendingAction = null; // Clear pending action
                } else {
                    // Just update lobby state without navigation
                    setGlobalState({ lobbyState: state, error: null });
                }
            });

            socketInstance.on('lobby:error', ({ message }: { message: string }) => {
                console.log('Lobby error:', message);
                pendingAction = null; // Clear pending action on error
                setGlobalState({ error: message });
            });

            socketInstance.on('lobby:player-joined', ({ player }: { player: Player }) => {
                console.log('Player joined:', player);
                // lobby:state is also emitted, so this is just for logging
            });

            socketInstance.on('lobby:player-left', ({ playerId }: { playerId: string }) => {
                console.log('Player left:', playerId);
                // lobby:state is also emitted, so this is just for logging
            });

            socketInstance.on(
                'lobby:host-changed',
                ({ hostId, code, previousHostId }: { hostId: string; code: string; previousHostId: string }) => {
                    console.log('Host changed:', { hostId, code, previousHostId });

                    if (socketInstance?.id && socketInstance.id === hostId) {
                        setGlobalState({
                            pendingNavigation: { type: 'host-waiting-room', roomPin: code },
                        });
                    }
                }
            );

            socketInstance.on('game:loading', () => {
                console.log('Game loading - all players to loading screen');
                setGlobalState({
                    pendingNavigation: { type: 'loading' }
                });
            });

            socketInstance.on('game:start', (payload: GameStartPayload) => {
                console.log('Game started:', payload);
                setGlobalState({
                    gameStart: payload,
                    submittedPlayerIds: [],
                    isJudging: false,
                    roundResult: null,
                    roundResultContext: null,
                    nextRoundStatus: null,
                    pendingNavigation: { type: 'game' }
                });
            });

            socketInstance.on('game:reaction', ({ icon, playerId }: { icon: string; playerId: string }) => {
                console.log('Remote reaction received:', icon, 'from', playerId);
                const newReaction = {
                    id: `${Date.now()}-${Math.random()}`,
                    icon,
                    playerId,
                };
                setGlobalState({
                    remoteReactions: [...globalState.remoteReactions, newReaction]
                });
            });

            socketInstance.on('game:round', (payload: RoundPayload) => {
                const key = `${payload.round}|${payload.deadline ?? ''}|${payload.theme}|${payload.criteria}`;
                if (lastRoundKey === key) return;
                lastRoundKey = key;

                console.log('Round:', payload);

                // Only navigate to /game if we're coming from round-result screen (roundResult exists).
                // On initial game start, roundResult is null and game:start already handles navigation.
                const shouldNavigateToGame = globalState.roundResult !== null;

                setGlobalState({
                    currentRound: payload,
                    tick: payload.remainingSeconds !== undefined ? { remainingSeconds: payload.remainingSeconds } : null,
                    submittedPlayerIds: [],
                    isJudging: false,
                    roundResult: null,
                    roundResultContext: null,
                    nextRoundStatus: null,
                    ...(shouldNavigateToGame ? { pendingNavigation: { type: 'game' } } : {}),
                });
            });

            socketInstance.on('game:tick', (payload: TickPayload) => {
                setGlobalState({ tick: payload });
            });

            socketInstance.on('game:player-submitted', (payload: PlayerSubmittedPayload) => {
                setGlobalState({
                    submittedPlayerIds: globalState.submittedPlayerIds.includes(payload.playerId)
                        ? globalState.submittedPlayerIds
                        : [...globalState.submittedPlayerIds, payload.playerId],
                });
            });

            socketInstance.on('game:judging', () => {
                setGlobalState({ isJudging: true });
            });

            socketInstance.on('game:round-result', (payload: RoundResultPayload) => {
                const key = `${payload.round}|${payload.winnerId}|${payload.photoPath}|${payload.objectName}|${payload.oneliner}`;
                if (lastRoundResultKey === key) return;
                lastRoundResultKey = key;

                setGlobalState({
                    isJudging: false,
                    roundResult: payload,
                    roundResultContext: globalState.currentRound,
                    nextRoundStatus: null,
                    pendingNavigation: { type: 'round-result' },
                });
            });

            socketInstance.on('game:next-round-status', (payload: NextRoundStatusPayload) => {
                setGlobalState({ nextRoundStatus: payload });
            });

            socketInstance.on('game:complete', (payload: GameCompletePayload) => {
                console.log('Game complete:', payload);
                setGlobalState({
                    gameComplete: payload,
                    pendingNavigation: { type: 'story-result' },
                });
            });

            socketInstance.on('game:awards', (payload: FinalAwardsPayload) => {
                console.log('Awards:', payload);
                setGlobalState({ awards: payload });
            });

            socketInstance.on('game:error', ({ message }: { message: string }) => {
                console.log('Game error:', message);
                setGlobalState({ error: message });
            });
        }
    }
    return socketInstance;
}

// Initialize socket on module load
const socket = getSocket();

// ============================================================================
// React Hook
// ============================================================================

export function useSocket() {
    // Use useSyncExternalStore to subscribe to global state
    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    // Ensure socket is connected
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }
    }, []);

    // Create a new lobby
    const createLobby = useCallback((name: string) => {
        pendingAction = 'create';
        setGlobalState({ error: null, pendingNavigation: null });
        socket.emit('lobby:create', { name });
    }, []);

    // Join an existing lobby
    const joinLobby = useCallback((code: string, name: string) => {
        pendingAction = 'join';
        setGlobalState({ error: null, pendingNavigation: null });
        socket.emit('lobby:join', { code: code.toUpperCase(), name });
    }, []);

    // Leave the current lobby
    const leaveLobby = useCallback(() => {
        socket.emit('lobby:leave');
        pendingAction = null;
        setGlobalState({
            lobbyState: null,
            gameStart: null,
            currentRound: null,
            tick: null,
            submittedPlayerIds: [],
            isJudging: false,
            roundResult: null,
            roundResultContext: null,
            nextRoundStatus: null,
            error: null,
            pendingNavigation: null,
            remoteReactions: [],
        });
    }, []);

    // Toggle ready status
    const setReady = useCallback((ready: boolean) => {
        socket.emit('lobby:ready', { ready });
    }, []);

    // Update lobby settings (host only)
    const updateSettings = useCallback((settings: { rounds?: number; roundTimeSeconds?: number }) => {
        socket.emit('lobby:settings', settings);
    }, []);

    // Start the game (host only)
    const startGame = useCallback(() => {
        socket.emit('lobby:start');
    }, []);

    // Submit a photo for the current round
    const submitPhoto = useCallback((photoPath: string) => {
        socket.emit('game:submit', { photoPath });
    }, []);

    const uploadAndSubmitPhoto = useCallback(async (photoUri: string): Promise<boolean> => {
        try {
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const ext = filename.split('.').pop()?.toLowerCase();
            const type =
                ext === 'png' ? 'image/png' :
                    ext === 'webp' ? 'image/webp' :
                        ext === 'heic' || ext === 'heif' ? 'image/heic' :
                            'image/jpeg';

            const formData = new FormData();
            formData.append('photo', { uri: photoUri, name: filename, type } as any);

            const res = await fetch(`${SERVER_URL}/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data?.photoPath) {
                const message = data?.error ?? 'Failed to upload photo';
                setGlobalState({ error: message });
                return false;
            }

            submitPhoto(data.photoPath);
            return true;
        } catch (err) {
            setGlobalState({ error: (err as Error).message });
            return false;
        }
    }, [submitPhoto]);

    const readyForNextRound = useCallback(() => {
        socket.emit('game:next-round-ready');
    }, []);

    // Clear pending navigation after navigation has occurred
    const clearPendingNavigation = useCallback(() => {
        setGlobalState({ pendingNavigation: null });
    }, []);

    // Send a reaction to other players in the room
    const sendReaction = useCallback((icon: string) => {
        socket.emit('game:reaction', { icon });
    }, []);

    // Remove a reaction from the queue after animation completes
    const consumeReaction = useCallback((reactionId: string) => {
        setGlobalState({
            remoteReactions: globalState.remoteReactions.filter(r => r.id !== reactionId)
        });
    }, []);

    return {
        socket,
        isConnected: state.isConnected,
        lobbyState: state.lobbyState,
        error: state.error,
        gameStart: state.gameStart,
        currentRound: state.currentRound,
        tick: state.tick,
        submittedPlayerIds: state.submittedPlayerIds,
        isJudging: state.isJudging,
        roundResult: state.roundResult,
        roundResultContext: state.roundResultContext,
        nextRoundStatus: state.nextRoundStatus,
        pendingNavigation: state.pendingNavigation,
        remoteReactions: state.remoteReactions,
        createLobby,
        joinLobby,
        leaveLobby,
        setReady,
        updateSettings,
        startGame,
        submitPhoto,
        uploadAndSubmitPhoto,
        readyForNextRound,
        clearPendingNavigation,
        sendReaction,
        consumeReaction,
        gameComplete: state.gameComplete,
        awards: state.awards,
    };
}
