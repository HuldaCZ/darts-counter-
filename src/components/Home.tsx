import { useApp } from '../state/AppContext';
import { MODE_META } from '../game/modes';

export default function Home() {
  const { navigate, game, quitGame } = useApp();
  const resumable = game && !game.finished;

  return (
    <div className="screen home">
      <div className="home__hero">
        <div className="home__logo">🎯</div>
        <div className="home__title">Darts Counter</div>
        <p className="home__tagline">
          Fast, offline scoring for X01, Cricket &amp; Around the Clock. Multiplayer, mobile-first.
        </p>
      </div>

      <div className="home__actions">
        {resumable && (
          <button className="home__resume" onClick={() => navigate('game')}>
            <span style={{ fontSize: 24 }}>▶️</span>
            <span className="label">
              <div className="k">Resume {MODE_META[game.mode].name}</div>
              <div className="v">
                {game.players.map((p) => p.name).join(' · ')}
              </div>
            </span>
          </button>
        )}

        <button
          className="btn btn--primary btn--block"
          onClick={() => {
            if (resumable) {
              const ok = window.confirm('Start a new game? Your current game will be discarded.');
              if (!ok) return;
              quitGame();
            }
            navigate('setup');
          }}
        >
          New Game
        </button>
        <button className="btn btn--block" onClick={() => navigate('history')}>
          🏆 History
        </button>
      </div>
    </div>
  );
}
