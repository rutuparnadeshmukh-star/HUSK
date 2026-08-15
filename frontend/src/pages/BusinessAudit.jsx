import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils';

const ACTION_LABELS = {
  employee_granted: 'Access granted',
  employee_revoked: 'Access revoked',
  employee_restored: 'Access restored',
  limits_updated: 'Limits updated',
  owner_limits_updated: 'Owner limits updated'
};

export default function BusinessAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/business/audit-log')
      .then((d) => setLogs(d.logs))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <p className="muted">Full timestamped record of every access grant, revoke and limit change.</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="center-pad"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><p className="muted">No audit events yet.</p></div>
        ) : (
          <div className="tx-list">
            {logs.map((l) => (
              <div key={l.id} className="tx-item">
                <span className={`tx-icon ${l.action.includes('revoked') ? 'out' : 'in'}`}>
                  {l.action.includes('revoked') ? '!' : '✓'}
                </span>
                <div className="tx-meta">
                  <strong>{ACTION_LABELS[l.action] || l.action}</strong>
                  <span className="muted tiny">{l.detail}</span>
                </div>
                <span className="muted tiny">{formatDateTime(l.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
