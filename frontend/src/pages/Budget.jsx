import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils';

export default function Budget() {
  const [data, setData] = useState(null);
  const [limit, setLimit] = useState('');
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get('/budget').then(setData).catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    await api.post('/budget', { limit: Number(limit) });
    toast('Budget limit saved.', 'success');
    setLimit('');
    load();
  };

  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  const pct = data.limit > 0 ? Math.min(100, Math.round((data.spent / data.limit) * 100)) : 0;
  const left = data.limit - data.spent;

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Save money budget</h1>
          <p className="muted">Set a monthly limit and stay on track.</p>
        </div>
      </div>
      <div className="balance-card">
        <div className="balance-top"><span className="muted">Budget · {data.month}</span><span className="chip">{pct}% used</span></div>
        <div className="balance-amount">{formatINR(left)}</div>
        <div className="balance-stats">
          <div><span className="muted tiny">Limit</span><strong>{formatINR(data.limit)}</strong></div>
          <div><span className="muted tiny">Spent</span><strong>{formatINR(data.spent)}</strong></div>
          <div><span className="muted tiny">Left</span><strong>{formatINR(Math.max(0, left))}</strong></div>
        </div>
        <div className="limit-bar">
          <div className="limit-track"><div className="limit-fill" style={{ width: `${pct}%`, background: pct > 90 ? 'var(--danger,#ef4444)' : undefined }} /></div>
        </div>
        {pct >= 90 && <p className="form-error">Heads up — you have used {pct}% of your budget.</p>}
      </div>
      <div className="card">
        <div className="card-head"><h3>Set budget limit</h3></div>
        <div className="field-row">
          <div className="field">
            <span>Monthly limit (₹)</span>
            <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder={String(data.limit || 0)} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={save}>Save limit</button>
        </div>
      </div>
    </div>
  );
}
