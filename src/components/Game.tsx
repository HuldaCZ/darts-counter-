import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { MAX_DARTS_PER_TURN, MODE_META, dartScore, makeDart, replay } from '../game/modes';
import type { Multiplier } from '../game/types';
import PlayerCard from './PlayerCard';
import Keypad from './Keypad';

export default function Game() {
  const { game, dispatchGame, quitGame, navigate } = useApp();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // game is guaranteed non-null when this screen renders (see App).
  const g = game!;

  const view = useMemo(
    () => replay(g.mode, g.config, g.order, g.turns),
    [g.mode, g.config, g.order, g.turns],
  );

  const currentTurn = g.turns[g.turns.length - 1];
  const activePlayerId = g.finished ? g.winnerId : currentTurn.playerId;

  const totalDarts = useMemo(
    () => g.turns.reduce((n, t) => n + t.darts.length, 0),
    [g.turns],
  );

  // Toast bust messages when a new dart causes a bust.
  const prevDarts = useRef(totalDarts);
  useEffect(() => {
    if (totalDarts > prevDarts.current) {
      // Find the turn containing the most recent dart.
      let idx = -1;
      for (let i = g.turns.length - 1; i >= 0; i--) {
        if (g.turns[i].darts.length > 0) {
          idx = i;
          break;
        }
      }
      const result = idx >= 0 ? view.turnResults[idx] : null;
      if (result?.busted) showToast(result.message || 'Bust');
    }
    prevDarts.current = totalDarts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDarts]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  }

  const onDart = (value: number, multiplier: Multiplier) => {
    dispatchGame({ type: 'ADD_DART', dart: makeDart(value, multiplier) });
  };

  const turnTotal = currentTurn.darts.reduce((n, d) => n + dartScore(d), 0);
  const winner = g.winnerId ? g.players.find((p) => p.id === g.winnerId) : null;

  return (
    <div className="screen game">
      <div className="topbar">
        <button
          className="btn btn--icon btn--ghost"
          aria-label="Quit"
          onClick={() => {
            if (window.confirm('Quit this game? Progress will be lost.')) quitGame();
          }}
        >
          ←
        </button>
        <h1>{MODE_META[g.mode].name}</h1>
        <span className="spacer" />
        {!g.finished && (
          <span className="chip">
            Dart {Math.min(currentTurn.darts.length + 1, MAX_DARTS_PER_TURN)}/{MAX_DARTS_PER_TURN}
          </span>
        )}
      </div>

      <div className="board">
        {g.order.map((pid) => {
          const player = g.players.find((p) => p.id === pid)!;
          return (
            <PlayerCard
              key={pid}
              mode={g.mode}
              player={player}
              state={view.states[pid]}
              active={pid === activePlayerId && !g.finished}
              winner={pid === g.winnerId}
              doubleOut={g.config.doubleOut}
            />
          );
        })}
      </div>

      {!g.finished && (
        <>
          <div className="turn">
            <div className="turn__darts">
              {Array.from({ length: MAX_DARTS_PER_TURN }).map((_, i) => {
                const d = currentTurn.darts[i];
                return (
                  <div
                    key={i}
                    className={`turn__slot${d ? ' turn__slot--filled' : ''}`}
                  >
                    {d ? d.label : '·'}
                  </div>
                );
              })}
            </div>
            <div className="turn__total">
              <div className="k">TURN</div>
              <div className="v">{turnTotal}</div>
            </div>
          </div>

          <Keypad
            onDart={onDart}
            onUndo={() => dispatchGame({ type: 'UNDO' })}
            canUndo={totalDarts > 0}
            disabled={g.finished}
          />
        </>
      )}

      {toast && <div className="toast">{toast}</div>}

      {g.finished && winner && (
        <div className="overlay">
          <div className="overlay__card">
            <div className="trophy">🏆</div>
            <div className="who">{winner.name} wins!</div>
            <div className="sub">{MODE_META[g.mode].name}</div>
            <div className="actions">
              <button
                className="btn btn--primary btn--block"
                onClick={() => dispatchGame({ type: 'RESET' })}
              >
                Play again
              </button>
              <button
                className="btn btn--block"
                onClick={() => {
                  quitGame();
                  navigate('setup');
                }}
              >
                New game
              </button>
              <button className="btn btn--ghost btn--block" onClick={quitGame}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
