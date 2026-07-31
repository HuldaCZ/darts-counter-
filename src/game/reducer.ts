import type { Dart, GameConfig, GameState, Mode, Player, Turn } from './types';
import { MAX_DARTS_PER_TURN, replay } from './modes';

export type GameAction =
  | { type: 'ADD_DART'; dart: Dart }
  | { type: 'UNDO' }
  | { type: 'RESET' };

function nextPlayerId(order: string[], currentId: string): string {
  const idx = order.indexOf(currentId);
  return order[(idx + 1) % order.length];
}

function currentTurn(state: GameState): Turn {
  return state.turns[state.turns.length - 1];
}

// Recompute finished/winner flags from the turn log.
function withDerivedOutcome(state: GameState): GameState {
  const { winnerId } = replay(state.mode, state.config, state.order, state.turns);
  return { ...state, finished: winnerId != null, winnerId };
}

export function createGame(
  mode: Mode,
  config: GameConfig,
  players: Player[],
): GameState {
  const order = players.map((p) => p.id);
  return {
    id: `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mode,
    config,
    players,
    order,
    turns: [{ playerId: order[0], darts: [], done: false }],
    finished: false,
    winnerId: null,
    createdAt: Date.now(),
  };
}

function addDart(state: GameState, dart: Dart): GameState {
  if (state.finished) return state;

  const turns = state.turns.map((t) => ({ ...t, darts: [...t.darts] }));
  const cur = turns[turns.length - 1];
  cur.darts.push(dart);

  // Evaluate the current turn to know if it busted / finished / is complete.
  const { winnerId, turnResults } = replay(state.mode, state.config, state.order, turns);
  const result = turnResults[turns.length - 1];

  const turnComplete =
    cur.darts.length >= MAX_DARTS_PER_TURN || result.busted || result.finished;

  if (winnerId) {
    cur.done = true;
    return { ...state, turns, finished: true, winnerId };
  }

  if (turnComplete) {
    cur.done = true;
    turns.push({ playerId: nextPlayerId(state.order, cur.playerId), darts: [], done: false });
  }

  return { ...state, turns, finished: false, winnerId: null };
}

function undo(state: GameState): GameState {
  const turns = state.turns.map((t) => ({ ...t, darts: [...t.darts] }));

  if (state.finished) {
    // The finishing turn is the last one; reopen it and drop the last dart.
    const last = turns[turns.length - 1];
    last.done = false;
    last.darts.pop();
    return withDerivedOutcome({ ...state, turns });
  }

  const cur = turns[turns.length - 1];
  if (cur.darts.length > 0) {
    cur.darts.pop();
    return withDerivedOutcome({ ...state, turns });
  }

  // Current turn is empty — reopen the previous player's turn.
  if (turns.length < 2) return state; // nothing to undo
  turns.pop();
  const prev = turns[turns.length - 1];
  prev.done = false;
  prev.darts.pop();
  return withDerivedOutcome({ ...state, turns });
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_DART':
      return addDart(state, action.dart);
    case 'UNDO':
      return undo(state);
    case 'RESET':
      return createGame(state.mode, state.config, state.players);
    default:
      return state;
  }
}

export { currentTurn };
