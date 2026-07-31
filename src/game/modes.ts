// Pure darts game engine.
//
// A "dart" is: { value, multiplier, label }
//  - value 1..20 with multiplier 1/2/3
//  - value 25 (bull) with multiplier 1 (=25) or 2 (=50, bullseye)
//  - value 0 = miss
//
// Player statistics are always DERIVED by replaying the ordered list of turns,
// which makes undo trivially correct (drop the last dart and recompute).

import type {
  AtcState,
  CricketState,
  Dart,
  GameConfig,
  Mode,
  Multiplier,
  PlayerState,
  Turn,
  TurnResult,
  X01State,
} from './types';

export const MODES = {
  X01: 'x01',
  CRICKET: 'cricket',
  ATC: 'atc',
} as const;

export interface ModeMeta {
  id: Mode;
  name: string;
  tagline: string;
}

export const MODE_META: Record<Mode, ModeMeta> = {
  x01: { id: 'x01', name: 'X01', tagline: '301 / 501 / 701 — race to zero' },
  cricket: { id: 'cricket', name: 'Cricket', tagline: 'Close 15–20 & bull, outscore rivals' },
  atc: { id: 'atc', name: 'Around the Clock', tagline: 'Hit 1 → 20 → bull in order' },
};

export const MAX_DARTS_PER_TURN = 3;

export function dartScore(dart: Dart): number {
  if (!dart || dart.value === 0) return 0;
  return dart.value * dart.multiplier;
}

export function dartLabel(dart: Dart): string {
  if (!dart) return '';
  if (dart.value === 0) return 'Miss';
  if (dart.value === 25) return dart.multiplier === 2 ? 'Bull' : '25';
  const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
  return `${prefix}${dart.value}`;
}

export function makeDart(value: number, multiplier: Multiplier): Dart {
  const dart: Dart = { value, multiplier, label: '' };
  dart.label = dartLabel(dart);
  return dart;
}

export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25];
export const ATC_SEQUENCE: number[] = [...Array(20)].map((_, i) => i + 1).concat(25);

// ---------------------------------------------------------------------------
// Per-mode turn evaluation.
// ---------------------------------------------------------------------------

function initX01(config: GameConfig): X01State {
  return { score: config.startingScore, dartsThrown: 0, totalScored: 0 };
}

function applyTurnX01(state: X01State, darts: Dart[], config: GameConfig): TurnResult<X01State> {
  let score = state.score;
  const turnStart = state.score;
  let busted = false;
  let finished = false;
  let message = '';
  let scoredThisTurn = 0;

  for (const dart of darts) {
    const remaining = score - dartScore(dart);
    if (remaining < 0) {
      busted = true;
      message = 'Bust — over zero';
      break;
    }
    if (remaining === 0) {
      if (config.doubleOut && dart.multiplier !== 2) {
        busted = true;
        message = 'Bust — must finish on a double';
        break;
      }
      score = 0;
      scoredThisTurn += dartScore(dart);
      finished = true;
      break;
    }
    if (remaining === 1 && config.doubleOut) {
      busted = true;
      message = 'Bust — can’t finish on 1';
      break;
    }
    score = remaining;
    scoredThisTurn += dartScore(dart);
  }

  if (busted) {
    return {
      state: { ...state, score: turnStart, dartsThrown: state.dartsThrown + darts.length },
      busted: true,
      finished: false,
      message,
    };
  }

  return {
    state: {
      ...state,
      score,
      dartsThrown: state.dartsThrown + darts.length,
      totalScored: state.totalScored + scoredThisTurn,
    },
    busted: false,
    finished,
    message,
  };
}

function initCricket(): CricketState {
  const marks: Record<number, number> = {};
  for (const t of CRICKET_TARGETS) marks[t] = 0;
  return { marks, points: 0, dartsThrown: 0 };
}

function applyTurnCricket(
  state: CricketState,
  darts: Dart[],
  _config: GameConfig,
  others: CricketState[],
): TurnResult<CricketState> {
  const marks = { ...state.marks };
  let points = state.points;

  // You only score points on a number YOU have closed and at least one
  // opponent has NOT closed.
  const openForScoring = (num: number) =>
    marks[num] >= 3 && others.some((o) => (o.marks?.[num] ?? 0) < 3);

  for (const dart of darts) {
    const num = dart.value;
    if (!CRICKET_TARGETS.includes(num)) continue;
    const hits = num === 25 ? Math.min(dart.multiplier, 2) : dart.multiplier;
    for (let h = 0; h < hits; h++) {
      if (marks[num] < 3) marks[num] += 1;
      else if (openForScoring(num)) points += num;
    }
  }

  const allClosed = CRICKET_TARGETS.every((t) => marks[t] >= 3);
  const highestScore = Math.max(points, ...others.map((o) => o.points ?? 0));
  const finished = allClosed && points >= highestScore;

  return {
    state: { ...state, marks, points, dartsThrown: state.dartsThrown + darts.length },
    busted: false,
    finished,
    message: finished ? 'All closed & leading!' : '',
  };
}

function initAtc(): AtcState {
  return { targetIndex: 0, dartsThrown: 0, hits: 0 };
}

function applyTurnAtc(state: AtcState, darts: Dart[], config: GameConfig): TurnResult<AtcState> {
  let targetIndex = state.targetIndex;
  let hits = state.hits;
  let finished = false;

  for (const dart of darts) {
    if (targetIndex >= ATC_SEQUENCE.length) break;
    const target = ATC_SEQUENCE[targetIndex];
    const mustDouble = config.atcDoubleBull && target === 25;
    if (dart.value === target && (!mustDouble || dart.multiplier === 2)) {
      targetIndex += 1;
      hits += 1;
      if (targetIndex >= ATC_SEQUENCE.length) {
        finished = true;
        break;
      }
    }
  }

  return {
    state: { ...state, targetIndex, hits, dartsThrown: state.dartsThrown + darts.length },
    busted: false,
    finished,
    message: finished ? 'Finished the board!' : '',
  };
}

type EngineEntry = {
  init: (config: GameConfig) => PlayerState;
  applyTurn: (
    state: PlayerState,
    darts: Dart[],
    config: GameConfig,
    others: PlayerState[],
  ) => TurnResult;
};

const ENGINE: Record<Mode, EngineEntry> = {
  x01: {
    init: initX01,
    applyTurn: (s, d, c) => applyTurnX01(s as X01State, d, c),
  },
  cricket: {
    init: initCricket,
    applyTurn: (s, d, c, o) => applyTurnCricket(s as CricketState, d, c, o as CricketState[]),
  },
  atc: {
    init: initAtc,
    applyTurn: (s, d, c) => applyTurnAtc(s as AtcState, d, c),
  },
};

export interface ReplayResult {
  states: Record<string, PlayerState>;
  winnerId: string | null;
  turnResults: TurnResult[];
}

// Replay all turns and produce derived per-player state + who won.
export function replay(mode: Mode, config: GameConfig, order: string[], turns: Turn[]): ReplayResult {
  const engine = ENGINE[mode];
  const states: Record<string, PlayerState> = {};
  for (const pid of order) states[pid] = engine.init(config);

  const turnResults: TurnResult[] = [];
  let winnerId: string | null = null;

  for (const turn of turns) {
    if (winnerId) {
      turnResults.push({ state: states[turn.playerId], busted: false, finished: false, message: '' });
      continue;
    }
    const others = order.filter((pid) => pid !== turn.playerId).map((pid) => states[pid]);
    const result = engine.applyTurn(states[turn.playerId], turn.darts, config, others);
    states[turn.playerId] = result.state;
    turnResults.push(result);
    if (result.finished) winnerId = turn.playerId;
  }

  return { states, winnerId, turnResults };
}

export function createPlayerState(mode: Mode, config: GameConfig): PlayerState {
  return ENGINE[mode].init(config);
}
