import { useMemo } from 'react';

export default function LineChart({ data = [], width = 560, height = 220, stroke = 'var(--primary)', fill = true, id = 'line' }) {
  const { points, path, areaPath, min, max } = useMemo(() => {
    if (!data.length) return { points: [], path: '', areaPath: '', min: 0, max: 1 };
    const pad = 10;
    const vals = data.map((d) => Number(d.value));
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const range = mx - mn || 1;
    const stepX = (width - pad * 2) / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => ({
      x: pad + i * stepX,
      y: pad + (height - pad * 2) * (1 - (Number(d.value) - mn) / range)
    }));
    const p = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${p} L${pts[pts.length - 1].x.toFixed(1)},${height - pad} L${pts[0].x.toFixed(1)},${height - pad} Z`;
    return { points: pts, path: p, areaPath: area, min: mn, max: mx };
  }, [data, width, height]);

  if (!data.length) return <div className="muted center-pad">No data available</div>;

  const last = points[points.length - 1];
  const first = points[0];

  return (
    <div className="line-chart-wrap">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill && <path d={areaPath} fill={`url(#${id})`} />}
        <path d={path} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {first && <circle cx={first.x} cy={first.y} r="3" fill={stroke} opacity="0.6" />}
        {last && <circle cx={last.x} cy={last.y} r="4.5" fill={stroke} stroke="var(--card)" strokeWidth="2" />}
      </svg>
      <div className="line-chart-labels">
        <span className="muted tiny">{data[0] ? data[0].label || data[0].date : ''}</span>
        <span className="muted tiny">{data[data.length - 1] ? data[data.length - 1].label || data[data.length - 1].date : ''}</span>
      </div>
    </div>
  );
}
