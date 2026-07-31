import { useState } from 'react';
import type { Multiplier } from '../game/types';

interface KeypadProps {
  onDart: (value: number, multiplier: Multiplier) => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
}

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function Keypad({ onDart, onUndo, canUndo, disabled }: KeypadProps) {
  const [mult, setMult] = useState<Multiplier>(1);

  const press = (value: number, forced?: Multiplier) => {
    if (disabled) return;
    onDart(value, forced ?? mult);
    setMult(1);
  };

  return (
    <div className="keypad">
      <div className="keypad__mult">
        {[1, 2, 3].map((m) => (
          <button
            key={m}
            className={`multbtn multbtn--x${m}${mult === m ? ' multbtn--active' : ''}`}
            onClick={() => setMult(m as Multiplier)}
            disabled={disabled}
          >
            {m === 1 ? 'Single' : m === 2 ? 'Double' : 'Triple'}
          </button>
        ))}
      </div>

      <div className="keypad__grid">
        {NUMBERS.map((n) => (
          <button key={n} className="key" onClick={() => press(n)} disabled={disabled}>
            {n}
          </button>
        ))}
      </div>

      <div className="keypad__extra">
        <button className="key key--wide key--miss" onClick={() => press(0, 1)} disabled={disabled}>
          Miss
        </button>
        <button className="key key--wide" onClick={() => press(25, 1)} disabled={disabled}>
          25
        </button>
        <button className="key key--wide key--bull" onClick={() => press(25, 2)} disabled={disabled}>
          Bull
        </button>
        <button
          className="key key--wide key--undo"
          onClick={onUndo}
          disabled={!canUndo}
        >
          ↶ Undo
        </button>
      </div>
    </div>
  );
}
