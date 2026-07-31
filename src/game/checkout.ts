// Computes a checkout suggestion (how to finish an X01 leg) for a given score.
// Returns an array of dart labels (e.g. ['T20', 'T20', 'D10']) or null.

interface Segment {
  score: number;
  label: string;
  isDouble: boolean;
}

function buildSegments(): Segment[] {
  const segs: Segment[] = [];
  for (let v = 1; v <= 20; v++) {
    segs.push({ score: v, label: `${v}`, isDouble: false });
    segs.push({ score: v * 2, label: `D${v}`, isDouble: true });
    segs.push({ score: v * 3, label: `T${v}`, isDouble: false });
  }
  segs.push({ score: 25, label: '25', isDouble: false });
  segs.push({ score: 50, label: 'Bull', isDouble: true });
  return segs.sort((a, b) => b.score - a.score);
}

const SEGMENTS = buildSegments();

export function checkoutHint(score: number, doubleOut = true): string[] | null {
  if (score <= 0 || score > 170) return null;
  const needDouble = doubleOut;

  for (const d of SEGMENTS) {
    if (d.score === score && (!needDouble || d.isDouble)) return [d.label];
  }
  for (const a of SEGMENTS) {
    if (a.score >= score) continue;
    const rem = score - a.score;
    for (const b of SEGMENTS) {
      if (b.score === rem && (!needDouble || b.isDouble)) return [a.label, b.label];
    }
  }
  for (const a of SEGMENTS) {
    if (a.score >= score) continue;
    for (const b of SEGMENTS) {
      const rem = score - a.score - b.score;
      if (rem <= 0) continue;
      for (const c of SEGMENTS) {
        if (c.score === rem && (!needDouble || c.isDouble)) return [a.label, b.label, c.label];
      }
    }
  }
  return null;
}
