import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { formatINR, formatDate } from '../utils';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [client, setClient] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDays, setDueDays] = useState(15);
  const [rClient, setRClient] = useState('');
  const [rAmount, setRAmount] = useState('');
  const [rFreq, setRFreq] = useState('monthly');
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get('/invoices').then((d) => setInvoices(d.invoices)).catch((e) => toast(e.message, 'error'));
    api.get('/invoices/recurring').then((d) => setRecurring(d.recurring)).catch(() => {});
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/invoices', { client, amount: Number(amount), dueDays: Number(dueDays) });
    toast('Invoice created.', 'success');
    setClient(''); setAmount('');
    load();
  };
  const addRecurring = async (e) => {
    e.preventDefault();
    await api.post('/invoices/recurring', { client: rClient, amount: Number(rAmount), freq: rFreq });
    toast('Recurring invoice scheduled.', 'success');
    setRClient(''); setRAmount('');
    load();
  };
  const markPaid = async (inv) => {
    await api.post(`/invoices/${inv.id}/status`, { status: 'paid', amount: inv.amount });
    toast(`Invoice ${inv.number} marked paid.`, 'success');
    load();
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Invoicing</h1>
          <p className="muted">Create, track and mark invoices paid. Set up recurring billing with reminders.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>New invoice</h3></div>
          <form className="form-stack" onSubmit={create}>
            <label className="field"><span>Client</span><input value={client} onChange={(e) => setClient(e.target.value)} required /></label>
            <label className="field"><span>Amount (₹)</span><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
            <label className="field"><span>Due in (days)</span><input type="number" min="1" max="365" value={dueDays} onChange={(e) => setDueDays(e.target.value)} /></label>
            <button type="submit" className="btn btn-primary">Create invoice</button>
          </form>
        </div>
        <div className="card">
          <div className="card-head"><h3>Recurring invoice</h3></div>
          <form className="form-stack" onSubmit={addRecurring}>
            <label className="field"><span>Client</span><input value={rClient} onChange={(e) => setRClient(e.target.value)} required /></label>
            <label className="field"><span>Amount (₹)</span><input type="number" min="1" value={rAmount} onChange={(e) => setRAmount(e.target.value)} required /></label>
            <label className="field"><span>Frequency</span><select value={rFreq} onChange={(e) => setRFreq(e.target.value)}>
              <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
            </select></label>
            <button type="submit" className="btn btn-primary">Schedule</button>
          </form>
          {recurring.length > 0 && (
            <div className="tx-list" style={{ marginTop: 12 }}>
              {recurring.map((r) => (
                <div key={r.id} className="tx-item">
                  <div className="tx-meta"><strong>{r.client}</strong><span className="muted tiny">Every {r.freq} · {r.active ? 'active' : 'paused'}</span></div>
                  <span className="tx-amount out">{formatINR(r.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>All invoices</h3></div>
        {invoices.length === 0 ? (
          <div className="empty-state"><p className="muted">No invoices yet. Create your first invoice.</p></div>
        ) : (
          <div className="tx-list">
            {invoices.map((inv) => (
              <div key={inv.id} className="tx-item">
                <span className={`tx-icon ${inv.status === 'paid' ? 'in' : 'out'}`}>{inv.status === 'paid' ? '↓' : '→'}</span>
                <div className="tx-meta">
                  <strong>{inv.number} · {inv.client}</strong>
                  <span className={`muted tiny chip-sm ${inv.status}`}>due {formatDate(inv.due)} · {inv.status}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${inv.status === 'paid' ? 'in' : 'out'}`}>{formatINR(inv.amount)}</span>
                  {inv.status !== 'paid' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => markPaid(inv)}>Mark paid</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
