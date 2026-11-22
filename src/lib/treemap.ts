// Squarified treemap layout (Bruls, Huizing & van Wijk). Pure function.
export interface TreemapInput {
  id: string;
  value: number;
}
export interface TreemapRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function worst(row: number[], side: number): number {
  const s = row.reduce((a, b) => a + b, 0);
  if (s <= 0 || side <= 0) return Infinity;
  const max = Math.max(...row),
    min = Math.min(...row);
  const s2 = s * s,
    side2 = side * side;
  return Math.max((side2 * max) / s2, s2 / (side2 * min));
}

export function squarify(items: TreemapInput[], width: number, height: number): TreemapRect[] {
  const valid = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  if (!valid.length || width <= 0 || height <= 0) return [];
  const total = valid.reduce((a, b) => a + b.value, 0);
  const scale = (width * height) / total;
  const areas = valid.map((i) => ({ id: i.id, a: i.value * scale }));
  const out: TreemapRect[] = [];
  let x = 0,
    y = 0,
    w = width,
    h = height;
  let i = 0;
  while (i < areas.length) {
    const side = Math.min(w, h);
    const row: typeof areas = [areas[i]!];
    i++;
    while (i < areas.length) {
      const next = areas[i]!;
      const cur = row.map((r) => r.a);
      if (worst([...cur, next.a], side) <= worst(cur, side)) {
        row.push(next);
        i++;
      } else break;
    }
    const sum = row.reduce((a, r) => a + r.a, 0);
    if (w >= h) {
      const rw = sum / h;
      let cy = y;
      for (const r of row) {
        const rh = r.a / rw;
        out.push({ id: r.id, x, y: cy, w: rw, h: rh });
        cy += rh;
      }
      x += rw;
      w -= rw;
    } else {
      const rh = sum / w;
      let cx = x;
      for (const r of row) {
        const rw = r.a / rh;
        out.push({ id: r.id, x: cx, y, w: rw, h: rh });
        cx += rw;
      }
      y += rh;
      h -= rh;
    }
  }
  return out;
}
