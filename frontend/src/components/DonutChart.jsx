import { CATEGORY_COLORS } from '../utils';
import { formatINR } from '../utils';

export default function DonutChart({ data = [], total = 0, size = 240, thickness = 30 }) {
  const items = data.length ? data : [];
  const sum = total || items.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const c = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={thickness} />
        {items.map((d, i) => {
          const len = (d.value / sum) * c;
          const dash = `${len} ${c - len}`;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={CATEGORY_COLORS[d.name] || '#64748b'}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="donut-center">
        <span className="donut-total">{formatINR(sum)}</span>
        <span className="muted">Total spent</span>
      </div>
    </div>
  );
}
