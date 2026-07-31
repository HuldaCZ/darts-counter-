import type { AtcState, CricketState, Mode, Player, PlayerState, X01State } from '../game/types';
import { ATC_SEQUENCE, CRICKET_TARGETS } from '../game/modes';
import { checkoutHint } from '../game/checkout';

interface Props {
  mode: Mode;
  player: Player;
  state: PlayerState;
  active: boolean;
  winner: boolean;
  doubleOut: boolean;
}

function marksGlyph(count: number): string {
  // 0 = empty, 1 = '/', 2 = 'X', 3 = 'Ⓧ' (closed)
  if (count <= 0) return '';
  if (count === 1) return '/';
  if (count === 2) return '✕';
  return 'ⓧ';
}

export default function PlayerCard({ mode, player, state, active, winner, doubleOut }: Props) {
  return (
    <div
      className={`pcard${active ? ' pcard--active' : ''}${winner ? ' pcard--winner' : ''}`}
    >
      <span className="pcard__bar" style={{ background: player.color }} />
      <div className="pcard__main">
        <div className="pcard__name">
          {winner && <span className="crown">👑</span>}
          {player.name}
        </div>
        {mode === 'x01' && <X01Body state={state as X01State} doubleOut={doubleOut} />}
        {mode === 'cricket' && <CricketBody state={state as CricketState} />}
        {mode === 'atc' && <AtcBody state={state as AtcState} />}
      </div>
      {mode === 'x01' && (
        <div className="pcard__score">{(state as X01State).score}</div>
      )}
      {mode === 'cricket' && (
        <div className="pcard__score">{(state as CricketState).points}</div>
      )}
    </div>
  );
}

function X01Body({ state, doubleOut }: { state: X01State; doubleOut: boolean }) {
  const avg =
    state.dartsThrown > 0 ? ((state.totalScored / state.dartsThrown) * 3).toFixed(1) : '—';
  const hint = checkoutHint(state.score, doubleOut);
  return (
    <>
      <div className="pcard__sub">
        {state.dartsThrown} darts · {avg} avg
      </div>
      {hint && <div className="pcard__hint">Checkout: {hint.join(' → ')}</div>}
    </>
  );
}

function CricketBody({ state }: { state: CricketState }) {
  return (
    <div className="cricket">
      {CRICKET_TARGETS.map((t) => {
        const c = state.marks[t] ?? 0;
        return (
          <div className="cricket__col" key={t}>
            <span className="num">{t === 25 ? 'B' : t}</span>
            <span className={`mk${c >= 3 ? ' mk--closed' : ''}`}>{marksGlyph(c)}</span>
          </div>
        );
      })}
    </div>
  );
}

function AtcBody({ state }: { state: AtcState }) {
  const done = state.targetIndex >= ATC_SEQUENCE.length;
  const target = done ? '✓' : ATC_SEQUENCE[state.targetIndex] === 25 ? 'Bull' : ATC_SEQUENCE[state.targetIndex];
  const pct = Math.round((state.targetIndex / ATC_SEQUENCE.length) * 100);
  return (
    <div className="atc">
      <div className="pcard__sub">Next target</div>
      <div className="atc__target">{target}</div>
      <div className="atc__bar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
