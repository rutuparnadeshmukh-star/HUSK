import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatINR, formatDateTime } from '../utils';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/personal/transactions')
      .then((d) => setTransactions(d.transactions))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = transactions.filter((t) => {
    if (filter === 'in') return t.direction === 'in';
    if (filter === 'out') return t.direction === 'out';
    return true;
  });

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p className="muted">Every payment, top-up and investment.</p>
        </div>
      </div>

      <div className="seg">
        <button type="button" className={`seg-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button type="button" className={`seg-btn ${filter === 'in' ? 'active' : ''}`} onClick={() => setFilter('in')}>Money in</button>
        <button type="button" className={`seg-btn ${filter === 'out' ? 'active' : ''}`} onClick={() => setFilter('out')}>Money out</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="center-pad"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p className="muted">No transactions found.</p></div>
        ) : (
          <div className="tx-list">
            {filtered.map((t) => (
              <div key={t.id} className="tx-item">
                <span className={`tx-icon ${t.direction === 'in' ? 'in' : 'out'}`}>{t.direction === 'in' ? '↓' : '↑'}</span>
                <div className="tx-meta">
                  <strong>{t.to}</strong>
                  <span className="muted tiny">{formatDateTime(t.date)} · {t.type}{t.method ? ` · ${t.method}` : ''}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${t.direction === 'in' ? 'in' : 'out'}`}>
                    {t.direction === 'in' ? '+' : '−'}{formatINR(t.amount)}
                  </span>
                  <span className={`status-chip ${t.status}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
