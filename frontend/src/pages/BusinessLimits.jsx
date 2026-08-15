import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils';

export default function BusinessLimits() {
  const [limits, setLimits] = useState({ dailyLimit: 0, txnLimit: 0 });
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get('/business/dashboard')
      .then((d) => setLimits({ dailyLimit: d.dailyLimit, txnLimit: d.txnLimit }))
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.post('/business/limits', limits);
      setLimits({ dailyLimit: d.dailyLimit, txnLimit: d.txnLimit });
      toast('Business spend limits updated.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Spend limits</h1>
          <p className="muted">Owner-configurable limits enforced server-side on every transaction.</p>
        </div>
      </div>

      <div className="card narrow">
        <form onSubmit={save} className="form-stack">
          <label className="field">
            <span>Daily business spend limit</span>
            <input type="number" min="1" value={limits.dailyLimit} onChange={(e) => setLimits((l) => ({ ...l, dailyLimit: Number(e.target.value) }))} required />
            <span className="muted tiny">Current: {formatINR(limits.dailyLimit)}</span>
          </label>
          <label className="field">
            <span>Per-transaction limit</span>
            <input type="number" min="1" value={limits.txnLimit} onChange={(e) => setLimits((l) => ({ ...l, txnLimit: Number(e.target.value) }))} required />
            <span className="muted tiny">Current: {formatINR(limits.txnLimit)}</span>
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save limits'}
          </button>
          <p className="muted tiny">
            These limits apply to the business balance. Per-employee limits are configured in the Employees page. Changes are recorded in the audit log.
          </p>
        </form>
      </div>
    </div>
  );
}
