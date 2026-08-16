export default function BarChart({ data = [], height = 220, horizontal = false }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (horizontal) {
    return (
      <div className="hbar-list">
        {data.map((d, i) => (
          <div key={i} className="hbar-row">
            <span className="hbar-label">{d.name}</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color || 'var(--primary)' }} />
            </div>
            <span className="hbar-value">{d.value.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%`, background: d.color || 'var(--primary)' }} />
          </div>
          <span className="bar-label">{d.name}</span>
        </div>
      ))}
    </div>
  );
}
