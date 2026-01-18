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
import type { Server } from 'socket.io';
export declare function setupSocketHandlers(io: Server): void;
//# sourceMappingURL=socket.handlers.d.ts.map