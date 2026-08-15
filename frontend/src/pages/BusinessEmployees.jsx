import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { formatDate } from '../utils';

export default function BusinessEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/business/employees')
      .then((d) => setEmployees(d.employees))
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (emp) => {
    setBusy(true);
    try {
      await api.post(`/business/employees/${emp.id}/revoke`);
      toast(`Access revoked for ${emp.name}. Sessions terminated.`, 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const restore = async (emp) => {
    setBusy(true);
    try {
      await api.post(`/business/employees/${emp.id}/restore`);
      toast(`Access restored for ${emp.name}.`, 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Employees</h1>
          <p className="muted">Grant and revoke access instantly. Every change is audited.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>+ Add employee</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="center-pad"><div className="spinner" /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <p className="muted">No employees yet. Add your first employee to manage access.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Daily / Txn limit</th>
                  <th>Transactions</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className={e.active ? '' : 'row-muted'}>
                    <td>
                      <div className="table-user">
                        <span className="avatar">{e.name.charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{e.name}</strong>
                          <span className="muted tiny">@{e.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip ${e.active ? 'active' : 'revoked'}`}>
                        {e.active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="mono">{e.dailyLimit.toLocaleString('en-IN')} / {e.txnLimit.toLocaleString('en-IN')}</td>
                    <td>{e.transactions}</td>
                    <td className="muted tiny">{formatDate(e.createdAt)}</td>
                    <td>
                      {e.active ? (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => revoke(e)} disabled={busy}>
                          Revoke
                        </button>
                      ) : (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => restore(e)} disabled={busy}>
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddEmployeeModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => { load(); }} />
    </div>
  );
}

function AddEmployeeModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', username: '', email: '', pin: '', dailyLimit: '50000', txnLimit: '20000' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/business/employees', { ...form, dailyLimit: Number(form.dailyLimit), txnLimit: Number(form.txnLimit) });
      toast('Employee added. Access granted and audited.', 'success');
      onAdded();
      onClose();
      setForm({ name: '', username: '', email: '', pin: '', dailyLimit: '50000', txnLimit: '20000' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add employee" size="lg">
      <form onSubmit={submit} className="form-stack">
        <div className="field-row">
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </label>
          <label className="field">
            <span>Login PIN (4-6 digits)</span>
            <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} required />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Daily limit</span>
            <input type="number" min="1" value={form.dailyLimit} onChange={(e) => setForm((f) => ({ ...f, dailyLimit: e.target.value }))} required />
          </label>
          <label className="field">
            <span>Per-transaction limit</span>
            <input type="number" min="1" value={form.txnLimit} onChange={(e) => setForm((f) => ({ ...f, txnLimit: e.target.value }))} required />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Adding...' : 'Grant access'}
        </button>
        <p className="muted tiny">The employee will need their own Payment PIN (set after first login) to send money.</p>
      </form>
    </Modal>
  );
}
