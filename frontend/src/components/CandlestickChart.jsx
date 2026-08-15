import { useMemo, useState } from 'react';

export default function CandlestickChart({ data = [], width = 620, height = 280 }) {
  const [hover, setHover] = useState(null);
  const [range, setRange] = useState(90);

  const filtered = useMemo(() => data.slice(-range), [data, range]);

  const { candles, min, max } = useMemo(() => {
    if (!filtered.length) return { candles: [], min: 0, max: 1 };
    const padX = 8;
    const padY = 18;
    const lows = filtered.map((d) => d.low);
    const highs = filtered.map((d) => d.high);
    const mn = Math.min(...lows);
    const mx = Math.max(...highs);
    const rangeV = mx - mn || 1;
    const bw = (width - padX * 2) / filtered.length;
    const bodyW = Math.max(2, bw * 0.6);
    const list = filtered.map((d, i) => {
      const cx = padX + bw * i + bw / 2;
      const yHigh = padY + (height - padY * 2) * (1 - (d.high - mn) / rangeV);
      const yLow = padY + (height - padY * 2) * (1 - (d.low - mn) / rangeV);
      const yOpen = padY + (height - padY * 2) * (1 - (d.open - mn) / rangeV);
      const yClose = padY + (height - padY * 2) * (1 - (d.close - mn) / rangeV);
      const up = d.close >= d.open;
      return {
        ...d,
        cx,
        yHigh,
        yLow,
        bodyTop: Math.min(yOpen, yClose),
        bodyHeight: Math.max(1, Math.abs(yClose - yOpen)),
        up,
        bodyW
      };
    });
    return { candles: list, min: mn, max: mx };
  }, [filtered, width, height]);

  const active = hover != null ? candles[hover] : candles[candles.length - 1];

  return (
    <div className="candle-wrap">
      <div className="candle-toolbar">
        <div className="candle-legend">
          {active && (
            <span className="candle-active">
              {active.date} &nbsp; O {active.open.toFixed(2)} &nbsp; H {active.high.toFixed(2)} &nbsp; L {active.low.toFixed(2)} &nbsp; C {active.close.toFixed(2)}
              <span className={active.up ? 'up' : 'down'}>{active.up ? ' (+)' : ' (-)'}</span>
            </span>
          )}
        </div>
        <div className="seg">
          {[30, 90, 180, 365].map((r) => (
            <button key={r} type="button" className={`seg-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
              {r}D
            </button>
          ))}
        </div>
      </div>
      <div className="candle-canvas">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={width} y1={pad(f, height)} y2={pad(f, height)} stroke="var(--grid)" strokeWidth="1" />
          ))}
          {candles.map((c, i) => (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <line x1={c.cx} x2={c.cx} y1={c.yHigh} y2={c.yLow} stroke={c.up ? 'var(--up)' : 'var(--down)'} strokeWidth="1.2" />
              <rect
                x={c.cx - c.bodyW / 2}
                y={c.bodyTop}
                width={c.bodyW}
                height={c.bodyHeight}
                fill={c.up ? 'var(--up)' : 'var(--down)'}
                rx="1"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function pad(f, h) {
  return 18 + (h - 36) * f;
}
