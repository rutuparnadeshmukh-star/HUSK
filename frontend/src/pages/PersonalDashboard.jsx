import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import BankLinkModal from '../components/BankLinkModal';
import { formatINR, formatDate } from '../utils';

export default function PersonalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkOpen, setLinkOpen] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/personal/dashboard')
      .then(setData)
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!data) return null;

  const spendPct = data.dailyLimit > 0 ? Math.min(100, Math.round((data.spendToday / data.dailyLimit) * 100)) : 0;

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Welcome back. Here's your money at a glance.</p>
        </div>
        <Link to="/app/personal/send" className="btn btn-primary">+ Send money</Link>
      </div>

      <div className="balance-card">
        <div className="balance-top">
          <span className="muted">Available balance</span>
          <span className="chip">{data.isEmployee ? 'Employee account' : 'Personal account'}</span>
        </div>
        <div className="balance-amount">{formatINR(data.balance)}</div>
        <div className="balance-stats">
          <div>
            <span className="muted tiny">Spent today</span>
            <strong>{formatINR(data.spendToday)}</strong>
          </div>
          <div>
            <span className="muted tiny">Total received</span>
            <strong>{formatINR(data.totalReceived)}</strong>
          </div>
          <div>
            <span className="muted tiny">Total spent</span>
            <strong>{formatINR(data.totalSpent)}</strong>
          </div>
        </div>
        <div className="limit-bar">
          <div className="limit-track">
            <div className="limit-fill" style={{ width: `${spendPct}%` }} />
          </div>
          <span className="muted tiny">
            Daily limit {formatINR(data.spendToday)} / {formatINR(data.dailyLimit)}
          </span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Linked bank accounts</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLinkOpen(true)}>
              + Link
            </button>
          </div>
          {data.bankLinks.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No bank accounts linked yet.</p>
              <button type="button" className="btn btn-outline" onClick={() => setLinkOpen(true)}>
                Link a bank account
              </button>
            </div>
          ) : (
            <div className="bank-list">
              {data.bankLinks.map((b) => (
                <div key={b.id} className="bank-item">
                  <span className="bank-dot" style={{ background: b.bankColor }} />
                  <div className="bank-meta">
                    <strong>{b.bankName}</strong>
                    <span className="muted tiny">••{b.last4} · {b.holderName}</span>
                  </div>
                  <span className="bank-balance">{formatINR(b.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recent transactions</h3>
            <Link to="/app/personal/transactions" className="link">View all</Link>
          </div>
          {data.transactions.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No transactions yet.</p>
            </div>
          ) : (
            <div className="tx-list">
              {data.transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="tx-item">
                  <span className={`tx-icon ${t.direction === 'in' ? 'in' : 'out'}`}>{t.direction === 'in' ? '↓' : '↑'}</span>
                  <div className="tx-meta">
                    <strong>{t.to}</strong>
                    <span className="muted tiny">{formatDate(t.date)} · {t.type}</span>
                  </div>
                  <span className={`tx-amount ${t.direction === 'in' ? 'in' : 'out'}`}>
                    {t.direction === 'in' ? '+' : '−'}{formatINR(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BankLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} onLinked={() => { toast('Bank account linked.', 'success'); load(); }} />
    </div>
  );
}
