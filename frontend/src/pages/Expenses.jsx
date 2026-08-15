import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import DonutChart from '../components/DonutChart';
import { CATEGORIES, CATEGORY_COLORS, formatINR, formatDate } from '../utils';

export default function Expenses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: 'Food', amount: '', note: '', date: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/personal/expenses')
      .then(setData)
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const addExpense = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/personal/expenses', { ...form, amount: Number(form.amount) });
      setForm((f) => ({ ...f, amount: '', note: '' }));
      toast('Expense added.', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!data) return null;

  const donut = data.summary.donut;

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Expense tracking</h1>
          <p className="muted">Your spending by category.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Spending breakdown</h3>
          </div>
          <div className="donut-section">
            <DonutChart data={donut} total={data.summary.total} size={250} thickness={32} />
            <div className="donut-legend">
              {donut.map((d) => (
                <div key={d.name} className="legend-row">
                  <span className="legend-dot" style={{ background: CATEGORY_COLORS[d.name] }} />
                  <span className="legend-name">{d.name}</span>
                  <span className="legend-value">{formatINR(d.value)}</span>
                </div>
              ))}
              {donut.length === 0 && <p className="muted">No expenses recorded yet.</p>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Add an expense</h3>
          </div>
          <form onSubmit={addExpense} className="form-stack">
            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 250" required />
            </label>
            <label className="field">
              <span>Note</span>
              <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. Lunch with team" />
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Adding...' : 'Add expense'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Recent expenses</h3>
        </div>
        {data.expenses.length === 0 ? (
          <div className="empty-state">
            <p className="muted">Add your first expense to see it here.</p>
          </div>
        ) : (
          <div className="tx-list">
            {data.expenses.map((x) => (
              <div key={x.id} className="tx-item">
                <span className="tx-icon out">◎</span>
                <div className="tx-meta">
                  <strong>{x.note || x.category}</strong>
                  <span className="muted tiny">{formatDate(x.date)} · {x.category}</span>
                </div>
                <span className="tx-amount out">−{formatINR(x.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
