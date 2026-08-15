import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatINR } from '../utils';

export default function SendMoney() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const submit = (e) => {
    e.preventDefault();
    if (!to.trim()) { toast('Enter a recipient.', 'error'); return; }
    const a = Number(amount);
    if (!a || a <= 0) { toast('Enter a valid amount.', 'error'); return; }
    setConfirm(true);
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Send money</h1>
          <p className="muted">Transfers are secured with your Payment PIN.</p>
        </div>
      </div>

      <div className="card narrow">
        <form onSubmit={submit} className="form-stack">
          <label className="field">
            <span>Recipient</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Name, UPI ID or account" autoComplete="off" />
          </label>
          <label className="field">
            <span>Amount</span>
            <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus required />
          </label>
          <label className="field">
            <span>Note (optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Processing...' : 'Send money'}
          </button>
          <p className="muted tiny center">A Payment PIN will be required to confirm this transfer.</p>
        </form>
      </div>

      <PaymentPinModal
        open={confirm}
        onClose={() => setConfirm(false)}
        amount={formatINR(Number(amount))}
        title={`Send to ${to}`}
        onConfirm={async (pin) => {
          setBusy(true);
          await api.post('/personal/transactions/send', { to, amount: Number(amount), note, paymentPin: pin });
          setConfirm(false);
          setAmount('');
          setNote('');
          toast('Money sent successfully.', 'success');
        }}
      />
    </div>
  );
}
