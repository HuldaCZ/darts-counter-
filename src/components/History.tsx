import { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext';
import { clearGames, deleteGame, getAllGames } from '../db/history';
import { MODE_META } from '../game/modes';
import type { GameRecord } from '../game/types';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History() {
  const { navigate } = useApp();
  const [games, setGames] = useState<GameRecord[] | null>(null);

  const load = () => getAllGames().then(setGames);

  useEffect(() => {
    void load();
  }, []);

  const remove = async (id: string) => {
    await deleteGame(id);
    void load();
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all game history?')) return;
    await clearGames();
    void load();
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn--icon btn--ghost" onClick={() => navigate('home')} aria-label="Back">
          ←
        </button>
        <h1>History</h1>
        <span className="spacer" />
        {games && games.length > 0 && (
          <button className="btn btn--ghost btn--danger" onClick={clearAll}>
            Clear
          </button>
        )}
      </div>

      {games && games.length === 0 && (
        <div className="history__empty">
          <span className="emoji">🎯</span>
          <p>No games yet. Finish a game to see it here.</p>
          <button className="btn btn--primary" onClick={() => navigate('setup')}>
            Start a game
          </button>
        </div>
      )}

      <div className="history">
        {games?.map((game) => (
          <div className="hitem" key={game.id}>
            <div className="hitem__mode">
              {game.mode === 'x01' ? game.config.startingScore : MODE_META[game.mode].name}
            </div>
            <div className="hitem__main">
              <div className="who">
                <span>👑</span>
                {game.winnerName}
              </div>
              <div className="meta">
                {game.players.map((p) => p.name).join(' · ')} — {formatDate(game.finishedAt)}
              </div>
            </div>
            <button
              className="btn btn--icon btn--ghost btn--danger"
              onClick={() => remove(game.id)}
              aria-label="Delete"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
