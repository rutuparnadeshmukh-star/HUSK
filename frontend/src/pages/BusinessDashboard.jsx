import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatINR, formatDateTime } from '../utils';
import { useAuth } from '../context/AuthContext';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/business/dashboard')
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

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>{data.role === 'owner' ? 'Business dashboard' : `Working at ${data.business}`}</h1>
          <p className="muted">
            {data.role === 'owner'
              ? 'Manage your business money, employees and limits.'
              : 'Your role is limited. Owner-only actions are protected server-side.'}
          </p>
        </div>
        <Link to="/app/business/send" className="btn btn-primary">+ Send money</Link>
      </div>

      <div className="balance-card">
        <div className="balance-top">
          <span className="muted">Business balance</span>
          <span className="chip">{data.role === 'owner' ? 'Owner' : 'Employee'}</span>
        </div>
        <div className="balance-amount">{formatINR(data.balance)}</div>
        <div className="balance-stats">
          <div>
            <span className="muted tiny">Today's spend</span>
            <strong>{formatINR(data.todaySpend)}</strong>
          </div>
          <div>
            <span className="muted tiny">Transactions</span>
            <strong>{data.totalTransactions}</strong>
          </div>
          {data.role === 'owner' ? (
            <div>
              <span className="muted tiny">Active employees</span>
              <strong>{data.activeEmployees} / {data.employeeCount}</strong>
            </div>
          ) : (
            <div>
              <span className="muted tiny">Txn limit</span>
              <strong>{formatINR(data.txnLimit)}</strong>
            </div>
          )}
        </div>
      </div>

      {data.role === 'owner' && (
        <div className="grid-3">
          <Link to="/app/business/employees" className="stat-card">
            <strong>{data.employeeCount}</strong>
            <span className="muted">Employees</span>
          </Link>
          <Link to="/app/business/limits" className="stat-card">
            <strong>{formatINR(data.dailyLimit)}</strong>
            <span className="muted">Daily limit</span>
          </Link>
          <Link to="/app/business/audit" className="stat-card">
            <strong>{data.todayCount}</strong>
            <span className="muted">Transactions today</span>
          </Link>
        </div>
      )}

      {data.role === 'owner' && (
        <div className="card">
          <div className="card-head">
            <h3>Employee join code</h3>
          </div>
          <div className="business-code">{data.employeeCode}</div>
          <p className="muted tiny">Share this code so employees can create accounts under your business.</p>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>Recent business activity</h3>
          <Link to="/app/business/transactions" className="link">View all</Link>
        </div>
        {data.recent.length === 0 ? (
          <div className="empty-state"><p className="muted">No activity yet.</p></div>
        ) : (
          <div className="tx-list">
            {data.recent.slice(0, 6).map((t) => (
              <div key={t.id} className="tx-item">
                <span className={`tx-icon ${t.direction === 'in' ? 'in' : 'out'}`}>{t.direction === 'in' ? '↓' : '↑'}</span>
                <div className="tx-meta">
                  <strong>{t.to}</strong>
                  <span className="muted tiny">{formatDateTime(t.date)} · {t.type}</span>
                </div>
                <span className={`tx-amount ${t.direction === 'in' ? 'in' : 'out'}`}>
                  {t.direction === 'in' ? '+' : '−'}{formatINR(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.role === 'employee' && user && (
        <div className="card">
          <div className="card-head"><h3>Your spend limits</h3></div>
          <div className="profile-row"><span className="muted">Daily limit</span><strong>{formatINR(data.dailyLimit)}</strong></div>
          <div className="profile-row"><span className="muted">Per-transaction limit</span><strong>{formatINR(data.txnLimit)}</strong></div>
          <div className="profile-row"><span className="muted">Today's spend</span><strong>{formatINR(data.todaySpend)}</strong></div>
        </div>
      )}
    </div>
  );
}
