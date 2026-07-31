import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { MODE_META } from '../game/modes';
import type { GameConfig, Mode, Player } from '../game/types';
import { colorForIndex, newId } from '../game/players';

const X01_STARTS = [301, 501, 701];
const MODE_ORDER: Mode[] = ['x01', 'cricket', 'atc'];

export default function Setup() {
  const { navigate, startGame, savedNames, setSavedNames } = useApp();

  const [mode, setMode] = useState<Mode>('x01');
  const [startingScore, setStartingScore] = useState(501);
  const [doubleOut, setDoubleOut] = useState(true);
  const [atcDoubleBull, setAtcDoubleBull] = useState(false);

  const [players, setPlayers] = useState<Player[]>(() =>
    savedNames.slice(0, 4).map((name, i) => ({ id: newId(), name, color: colorForIndex(i) })),
  );

  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers((ps) => [
      ...ps,
      { id: newId(), name: `Player ${ps.length + 1}`, color: colorForIndex(ps.length) },
    ]);
  };

  const removePlayer = (id: string) => {
    setPlayers((ps) =>
      (ps.length <= 1 ? ps : ps.filter((p) => p.id !== id)).map((p, i) => ({
        ...p,
        color: colorForIndex(i),
      })),
    );
  };

  const rename = (id: string, name: string) =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)));

  const start = () => {
    const cleaned = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `Player ${i + 1}`,
    }));
    setSavedNames(cleaned.map((p) => p.name));
    const config: GameConfig = { startingScore, doubleOut, atcDoubleBull };
    startGame(mode, config, cleaned);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn--icon btn--ghost" onClick={() => navigate('home')} aria-label="Back">
          ←
        </button>
        <h1>New Game</h1>
        <span className="spacer" />
      </div>

      <div className="setup">
        <div>
          <div className="section-title">Game mode</div>
          <div className="setup__modes">
            {MODE_ORDER.map((m) => (
              <button
                key={m}
                className={`mode-card${mode === m ? ' mode-card--active' : ''}`}
                onClick={() => setMode(m)}
              >
                <span className="mode-card__name">{MODE_META[m].name}</span>
                <span className="mode-card__tag">{MODE_META[m].tagline}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === 'x01' && (
          <div className="card">
            <div className="section-title">Starting score</div>
            <div className="setup__row">
              {X01_STARTS.map((s) => (
                <button
                  key={s}
                  className={`chip${startingScore === s ? ' chip--active' : ''}`}
                  onClick={() => setStartingScore(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="toggle">
              <span className="toggle__label">
                <div className="t">Double out</div>
                <div className="d">Must finish on a double</div>
              </span>
              <button
                className={`switch${doubleOut ? ' switch--on' : ''}`}
                onClick={() => setDoubleOut((v) => !v)}
                aria-label="Toggle double out"
              />
            </div>
          </div>
        )}

        {mode === 'atc' && (
          <div className="card">
            <div className="toggle">
              <span className="toggle__label">
                <div className="t">Double bull to finish</div>
                <div className="d">Require bullseye (50) on the final target</div>
              </span>
              <button
                className={`switch${atcDoubleBull ? ' switch--on' : ''}`}
                onClick={() => setAtcDoubleBull((v) => !v)}
                aria-label="Toggle double bull"
              />
            </div>
          </div>
        )}

        <div>
          <div className="section-title">Players ({players.length})</div>
          <div className="players">
            {players.map((p, i) => (
              <div className="players__item" key={p.id}>
                <span className="dot" style={{ background: p.color }} />
                <input
                  value={p.name}
                  maxLength={16}
                  onChange={(e) => rename(p.id, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                />
                <button
                  className="btn btn--icon btn--ghost btn--danger"
                  onClick={() => removePlayer(p.id)}
                  disabled={players.length <= 1}
                  aria-label="Remove player"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="btn btn--block" onClick={addPlayer} disabled={players.length >= 8}>
              + Add player
            </button>
          </div>
        </div>
      </div>

      <div className="setup__footer">
        <button className="btn btn--primary btn--block" onClick={start}>
          Start game
        </button>
      </div>
    </div>
  );
}
