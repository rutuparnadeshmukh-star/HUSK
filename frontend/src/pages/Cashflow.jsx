import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import DualLineChart from '../components/DualLineChart';
import BarChart from '../components/BarChart';
import { formatINR } from '../utils';

export default function Cashflow() {
  const [data, setData] = useState(null);
  const [gst, setGst] = useState(null);
  const [health, setHealth] = useState(null);
  const [days, setDays] = useState(30);
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get(`/cashflow?days=${days}`).then(setData).catch((e) => toast(e.message, 'error'));
    api.get('/gst').then(setGst).catch(() => {});
    api.get('/business-health').then(setHealth).catch(() => {});
  }, [days, toast]);

  useEffect(() => { load(); }, [load]);

  if (!data || !gst || !health) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Cash flow & compliance</h1>
          <p className="muted">Inflow vs outflow, GST and business health.</p>
        </div>
      </div>
      {health && (
        <div className="balance-card">
          <div className="balance-top"><span className="muted">Business health</span><span className={`chip ${health.score >= 75 ? 'ok' : health.score >= 50 ? 'warn' : 'bad'}`}>{health.label} · {health.score}/100</span></div>
          <div className="balance-amount">{health.label}</div>
          <div className="balance-stats">
            <div><span className="muted tiny">Inflow</span><strong className="in">{formatINR(health.inflow)}</strong></div>
            <div><span className="muted tiny">Outflow</span><strong className="out">{formatINR(health.outflow)}</strong></div>
            <div><span className="muted tiny">Margin</span><strong>{health.margin}%</strong></div>
          </div>
          <div className="limit-bar"><div className="limit-track"><div className="limit-fill" style={{ width: `${health.score}%` }} /></div></div>
          <p className="muted tiny">Pending invoices: {health.pendingInvoices} · Employees: {health.employeeCount} · Cash reserve {formatINR(health.cashReserve)}</p>
        </div>
      )}
      <div className="card">
        <div className="card-head">
          <h3>Cash flow ({data.rangeDays} days)</h3>
          <div className="seg">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" className={`seg-btn ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>{d}D</button>
            ))}
          </div>
        </div>
        <DualLineChart
          data={data.series.map((s) => ({ a: s.inflow, b: s.outflow }))}
          height={240}
          series={[{ label: 'Inflow', stroke: 'var(--up,#22c55e)' }, { label: 'Outflow', stroke: 'var(--down,#ef4444)' }]}
        />
        <div className="balance-stats">
          <div><span className="muted tiny">Total inflow</span><strong className="in">{formatINR(data.inflow)}</strong></div>
          <div><span className="muted tiny">Total outflow</span><strong className="out">{formatINR(data.outflow)}</strong></div>
          <div><span className="muted tiny">Net</span><strong>{formatINR(data.net)}</strong></div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>GST tracker</h3></div>
          <div className="profile-stack">
            <div className="profile-row"><span className="muted">GSTIN</span><strong>{gst.gstin}</strong></div>
            <div className="profile-row"><span className="muted">Taxable sales</span><strong>{formatINR(gst.taxable)}</strong></div>
            <div className="profile-row"><span className="muted">GST payable (18%)</span><strong>{formatINR(gst.gst)}</strong></div>
            <div className="profile-row"><span className="muted">Input credit</span><strong>{formatINR(gst.credit)}</strong></div>
          </div>
          <div className="tx-list" style={{ marginTop: 10 }}>
            {gst.periods.map((p) => (
              <div key={p.period} className="tx-item">
                <div className="tx-meta"><strong>{p.period}</strong><span className={`muted tiny chip-sm ${p.status}`}>{p.status}</span></div>
                <span className="tx-amount out">{formatINR(p.gst)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Business snapshot</h3></div>
          <BarChart data={[{ name: 'Inflow', value: health.inflow, color: 'var(--up,#22c55e)' }, { name: 'Outflow', value: health.outflow, color: 'var(--down,#ef4444)' }, { name: 'Reserve', value: health.cashReserve, color: 'var(--primary)' }]} horizontal />
          <p className="muted tiny">Revenue margin {health.margin}%. Keep an eye on pending invoices to improve your health score.</p>
        </div>
      </div>
    </div>
  );
}
