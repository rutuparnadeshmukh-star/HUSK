import { useEffect, useState } from 'react';
import Modal from './Modal';
import { api } from '../api';

export default function BankLinkModal({ open, onClose, onLinked }) {
  const [banks, setBanks] = useState([]);
  const [bankId, setBankId] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [stage, setStage] = useState('form');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStage('form');
      setError('');
      api.get('/personal/banks').then((d) => setBanks(d.banks)).catch(() => {});
    }
  }, [open]);

  const simulate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setStage('linking');
    await new Promise((r) => setTimeout(r, 2200));
    try {
      const d = await api.post('/personal/banks/link', {
        bankId,
        holderName,
        last4: accountNo.replace(/\D/g, '').slice(-4)
      });
      setStage('done');
      onLinked && onLinked(d.link);
    } catch (err) {
      setStage('form');
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Link a bank account">
      {stage === 'form' && (
        <form onSubmit={simulate} className="form-stack">
          <p className="muted">
            This is a simulated connection. Enter mock details to demonstrate secure bank linking.
          </p>
          <label className="field">
            <span>Select bank</span>
            <select value={bankId} onChange={(e) => setBankId(e.target.value)} required>
              <option value="">Choose a bank</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.type})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Account holder name</span>
            <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="e.g. Priya Sharma" required />
          </label>
          <label className="field">
            <span>Account number (mock)</span>
            <input
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 501002345678"
              maxLength="16"
              inputMode="numeric"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Connecting...' : 'Connect securely'}
          </button>
          <p className="muted tiny">Connection is encrypted and simulated. No real bank credentials are used.</p>
        </form>
      )}
      {stage === 'linking' && (
        <div className="link-progress">
          <div className="spinner large" />
          <p>Connecting to your bank securely...</p>
          <div className="link-steps">
            <span className="done">Authenticating</span>
            <span className="done">Fetching accounts</span>
            <span className="active">Securing connection</span>
          </div>
        </div>
      )}
      {stage === 'done' && (
        <div className="link-done">
          <div className="check-badge">✓</div>
          <h3>Account linked!</h3>
          <p className="muted">Your bank account has been connected successfully.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
