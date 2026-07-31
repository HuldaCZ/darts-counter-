import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { GameConfig, GameRecord, GameState, Mode, Player } from '../game/types';
import { createGame, gameReducer, type GameAction } from '../game/reducer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { saveGame } from '../db/history';

export type Screen = 'home' | 'setup' | 'game' | 'history';

interface AppContextValue {
  screen: Screen;
  navigate: (screen: Screen) => void;
  game: GameState | null;
  startGame: (mode: Mode, config: GameConfig, players: Player[]) => void;
  dispatchGame: (action: GameAction) => void;
  quitGame: () => void;
  savedNames: string[];
  setSavedNames: (names: string[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useLocalStorage<Screen>('dc.screen', 'home');
  const [game, setGame] = useLocalStorage<GameState | null>('dc.game', null);
  const [savedNames, setSavedNames] = useLocalStorage<string[]>('dc.names', [
    'Player 1',
    'Player 2',
  ]);
  const savedIdRef = useRef<string | null>(null);

  const navigate = useCallback((next: Screen) => setScreen(next), [setScreen]);

  const startGame = useCallback(
    (mode: Mode, config: GameConfig, players: Player[]) => {
      setGame(createGame(mode, config, players));
      setScreen('game');
    },
    [setGame, setScreen],
  );

  const dispatchGame = useCallback(
    (action: GameAction) => {
      setGame((prev) => (prev ? gameReducer(prev, action) : prev));
    },
    [setGame],
  );

  const quitGame = useCallback(() => {
    setGame(null);
    setScreen('home');
  }, [setGame, setScreen]);

  // Persist a finished game to IndexedDB exactly once.
  useEffect(() => {
    if (!game || !game.finished || !game.winnerId) return;
    if (savedIdRef.current === game.id) return;
    savedIdRef.current = game.id;

    const winner = game.players.find((p) => p.id === game.winnerId);
    const record: GameRecord = {
      id: game.id,
      mode: game.mode,
      config: game.config,
      players: game.players,
      winnerId: game.winnerId,
      winnerName: winner?.name ?? 'Unknown',
      turns: game.turns,
      createdAt: game.createdAt,
      finishedAt: Date.now(),
    };
    void saveGame(record);
  }, [game]);

  const value: AppContextValue = {
    screen,
    navigate,
    game,
    startGame,
    dispatchGame,
    quitGame,
    savedNames,
    setSavedNames,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
