import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import DonutChart from '../components/DonutChart';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import { formatINR } from '../utils';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [chartType, setChartType] = useState('donut');
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get(`/analytics?days=${days}`).then(setData).catch((e) => toast(e.message, 'error'));
  }, [days, toast]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  const donutData = data.expenseDonut.length ? data.expenseDonut : data.donut.map((d, i) => ({ ...d, color: ['#f97316', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'][i] }));

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Spend analytics</h1>
          <p className="muted">Your spending across the last {data.rangeDays} days.</p>
        </div>
        <div className="seg">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" className={`seg-btn ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>{d}D</button>
          ))}
        </div>
      </div>
      <div className="balance-card">
        <div className="balance-top"><span className="muted">Total spent</span><span className="chip">{data.rangeDays} days</span></div>
        <div className="balance-amount">{formatINR(data.totalSpent)}</div>
        <div className="balance-stats">
          <div><span className="muted tiny">Categories</span><strong>{data.donut.length}</strong></div>
          <div><span className="muted tiny">Daily avg</span><strong>{formatINR(Math.round(data.totalSpent / data.rangeDays))}</strong></div>
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <h3>By category</h3>
          <div className="seg">
            {['donut', 'line', 'bar'].map((t) => (
              <button key={t} type="button" className={`seg-btn ${chartType === t ? 'active' : ''}`} onClick={() => setChartType(t)}>{t}</button>
            ))}
          </div>
        </div>
        {chartType === 'donut' && <DonutChart data={donutData} height={260} />}
        {chartType === 'line' && <LineChart data={data.series.map((s) => ({ date: s.date, value: s.total }))} height={240} stroke="var(--primary)" />}
        {chartType === 'bar' && <BarChart data={data.donut.map((d) => ({ name: d.name, value: d.value, color: donutData.find((x) => x.name === d.name)?.color }))} />}
      </div>
      <div className="card">
        <div className="card-head"><h3>Top categories</h3></div>
        <BarChart data={donutData.map((d) => ({ name: d.name, value: d.value, color: d.color }))} horizontal />
      </div>
    </div>
  );
}
