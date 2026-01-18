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
}

// Navigation types for pending navigation
export type PendingNavigation =
    | { type: 'host-waiting-room'; roomPin: string }
    | { type: 'player-waiting-room'; roomPin: string }
    | { type: 'game' }
    | null;

// Server URL - update this to your backend URL
const SERVER_URL = 'http://10.19.130.64:3000';

// ============================================================================
// Global State Store (persists across component instances)
// ============================================================================

interface SocketState {
    isConnected: boolean;
    lobbyState: LobbyState | null;
    error: string | null;
    gameStart: GameStartPayload | null;
    currentRound: RoundPayload | null;
    pendingNavigation: PendingNavigation;
}

let globalState: SocketState = {
    isConnected: false,
    lobbyState: null,
    error: null,
    gameStart: null,
    currentRound: null,
    pendingNavigation: null,
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

let socketInstance: Socket | null = null;
let isInitialized = false;

// Track pending action to determine navigation type
let pendingAction: 'create' | 'join' | null = null;

function getSocket(): Socket {
    if (!socketInstance) {
        socketInstance = io(SERVER_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        // Set up event listeners once
        if (!isInitialized) {
            isInitialized = true;

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

            socketInstance.on('game:start', (payload: GameStartPayload) => {
                console.log('Game started:', payload);
                setGlobalState({
                    gameStart: payload,
                    pendingNavigation: { type: 'game' }
                });
            });

            socketInstance.on('game:round', (payload: RoundPayload) => {
                console.log('Round:', payload);
                setGlobalState({ currentRound: payload });
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
            error: null,
            pendingNavigation: null,
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

    // Clear pending navigation after navigation has occurred
    const clearPendingNavigation = useCallback(() => {
        setGlobalState({ pendingNavigation: null });
    }, []);

    return {
        socket,
        isConnected: state.isConnected,
        lobbyState: state.lobbyState,
        error: state.error,
        gameStart: state.gameStart,
        currentRound: state.currentRound,
        pendingNavigation: state.pendingNavigation,
        createLobby,
        joinLobby,
        leaveLobby,
        setReady,
        updateSettings,
        startGame,
        submitPhoto,
        clearPendingNavigation,
    };
}
