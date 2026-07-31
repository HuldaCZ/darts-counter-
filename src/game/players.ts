export const PLAYER_COLORS = [
  '#38e07b',
  '#4aa8ff',
  '#f5a623',
  '#ff5470',
  '#b980ff',
  '#2ee6d6',
  '#ff8f5a',
  '#7dd957',
];

export function colorForIndex(i: number): string {
  return PLAYER_COLORS[i % PLAYER_COLORS.length];
}

export function newId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
