import { useMemo } from 'react';

export default function DualLineChart({ series = [], data = [], height = 220, labels = ['Inflow', 'Outflow'] }) {
  const chart = useMemo(() => {
    if (!data.length) return { lines: [], max: 1, points: [] };
    const max = Math.max(...data.flatMap((d) => [d.a, d.b]), 1);
    const padX = 6;
    const padY = 16;
    const W = 600;
    const H = height;
    const n = data.length;
    const bw = (W - padX * 2) / Math.max(1, n - 1);
    const line = (key) => data.map((d, i) => [padX + (n === 1 ? W / 2 : bw * i), padY + (H - padY * 2) * (1 - d[key] / max)]);
    return {
      points: data,
      lines: [line('a'), line('b')],
      max,
      W,
      H,
      path: (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    };
  }, [data, height]);

  if (!data.length) return <div className="empty-state"><p className="muted">No data yet.</p></div>;
  return (
    <div>
      <div className="candle-legend">
        {series.map((s) => (
          <span key={s} className="legend-item"><i className="legend-dot" style={{ background: s.stroke }} />{s.label}</span>
        ))}
      </div>
      <svg width="100%" height={chart.H} viewBox={`0 0 ${chart.W} ${chart.H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={chart.W} y1={16 + (chart.H - 32) * f} y2={16 + (chart.H - 32) * f} stroke="var(--grid)" strokeWidth="1" />
        ))}
        {chart.lines.map((pts, i) => (
          <path key={i} d={chart.path(pts)} fill="none" stroke={labels[i].stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
    </div>
  );
}
