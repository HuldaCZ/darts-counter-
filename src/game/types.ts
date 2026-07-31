export type Multiplier = 1 | 2 | 3;

export interface Dart {
  value: number; // 1..20, 25 for bull, 0 for miss
  multiplier: Multiplier;
  label: string;
}

export type Mode = 'x01' | 'cricket' | 'atc';

export interface Player {
  id: string;
  name: string;
  color: string;
}

export interface Turn {
  playerId: string;
  darts: Dart[];
  done: boolean;
}

export interface GameConfig {
  startingScore: number; // X01
  doubleOut: boolean; // X01
  atcDoubleBull: boolean; // Around the Clock
}

export interface X01State {
  score: number;
  dartsThrown: number;
  totalScored: number;
}

export interface CricketState {
  marks: Record<number, number>;
  points: number;
  dartsThrown: number;
}

export interface AtcState {
  targetIndex: number;
  dartsThrown: number;
  hits: number;
}

export type PlayerState = X01State | CricketState | AtcState;

export interface TurnResult<S extends PlayerState = PlayerState> {
  state: S;
  busted: boolean;
  finished: boolean;
  message: string;
}

export interface GameState {
  id: string;
  mode: Mode;
  config: GameConfig;
  players: Player[];
  order: string[];
  turns: Turn[];
  finished: boolean;
  winnerId: string | null;
  createdAt: number;
}

export interface GameRecord {
  id: string;
  mode: Mode;
  config: GameConfig;
  players: Player[];
  winnerId: string | null;
  winnerName: string;
  turns: Turn[];
  createdAt: number;
  finishedAt: number;
}
