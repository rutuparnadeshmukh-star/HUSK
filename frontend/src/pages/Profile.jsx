import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatINR } from '../utils';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [pinModal, setPinModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [code, setCode] = useState(null);

  const isBusiness = user.mode === 'business';
  const isOwner = isBusiness && user.role === 'owner';

  const fetchCode = async () => {
    if (code) return;
    try {
      const d = await api.get('/auth/business-code');
      setCode(d.employeeCode);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const toggleBiometric = async (enabled) => {
    setBusy(true);
    try {
      await api.post('/auth/toggle-biometrics', { enabled });
      await refreshUser();
      toast(enabled ? 'Biometrics enabled.' : 'Biometrics disabled.', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const simulateAdd = async () => {
    setBusy(true);
    try {
      const a = Number(addAmount);
      if (!a || a <= 0) throw new Error('Enter a valid amount.');
      const { order } = await api.post('/payments/order', { amount: a, purpose: 'Add money to ARTHAM' });
      await new Promise((r) => setTimeout(r, 1800));
      const d = await api.post('/payments/simulate', { orderId: order.id });
      setAddMoneyOpen(false);
      setAddAmount('');
      await refreshUser();
      toast(`\u20B9${d.amount.toLocaleString('en-IN')} added to your balance.`, 'success');
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
          <h1>Profile & security</h1>
          <p className="muted">Manage your PINs, biometrics and session security.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Account</h3></div>
          <div className="profile-row"><span className="muted">Name</span><strong>{user.name}</strong></div>
          <div className="profile-row"><span className="muted">Username</span><strong>@{user.username}</strong></div>
          <div className="profile-row"><span className="muted">Email</span><strong>{user.email}</strong></div>
          <div className="profile-row"><span className="muted">Balance</span><strong>{formatINR(user.balance)}</strong></div>
          <div className="profile-row"><span className="muted">Mode</span><strong>{isBusiness ? 'Business' : 'Personal'}{isOwner ? ' · Owner' : isBusiness ? ' · Employee' : ''}</strong></div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Security</h3></div>
          <div className="action-list">
            <button type="button" className="action-row" onClick={() => setPinModal('login')}>
              <div><strong>Change login PIN</strong><span className="muted tiny">Logs out all other sessions</span></div>
              <span className="chevron">›</span>
            </button>
            <button type="button" className="action-row" onClick={() => setPinModal('payment')}>
              <div><strong>{user.paymentPinSet ? 'Change Payment PIN' : 'Set Payment PIN'}</strong><span className="muted tiny">Separate from your login PIN · required for every transaction</span></div>
              <span className="chevron">›</span>
            </button>
            <div className="action-row">
              <div><strong>Biometric login</strong><span className="muted tiny">Asked after PIN on login</span></div>
              <button
                type="button"
                className={`switch ${user.biometricEnabled ? 'on' : ''}`}
                onClick={() => toggleBiometric(!user.biometricEnabled)}
                disabled={busy}
                aria-label="Toggle biometrics"
              >
                <span className="knob" />
              </button>
            </div>
            <button type="button" className="action-row" onClick={async () => {
              await api.post('/auth/logout-all', {});
              toast('All sessions were signed out.', 'success');
              await logout();
              navigate('/login');
            }}>
              <div><strong>Log out all devices</strong><span className="muted tiny">Ends every active session</span></div>
              <span className="chevron">›</span>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Add money</h3></div>
          <p className="muted">Simulate a deposit via the mock Razorpay gateway. Webhook signatures are verified server-side.</p>
          <button type="button" className="btn btn-primary" onClick={() => setAddMoneyOpen(true)}>
            Add money to ARTHAM
          </button>
        </div>

        {isOwner && (
          <div className="card">
            <div className="card-head"><h3>Employee join code</h3></div>
            <p className="muted">Share this code so employees can request access to your business.</p>
            {code ? (
              <div className="business-code">{code}</div>
            ) : (
              <button type="button" className="btn btn-outline" onClick={fetchCode}>Reveal code</button>
            )}
          </div>
        )}
      </div>

      <PinChangeModal
        open={pinModal === 'login'}
        onClose={() => setPinModal(null)}
        title="Change login PIN"
        onConfirm={async (pin) => {
          const d = await api.post('/auth/change-pin', { currentPin: pin.current, newPin: pin.next });
          return d;
        }}
        successMsg="Login PIN changed. Other sessions were logged out."
        toast={toast}
      />
      <PinChangeModal
        open={pinModal === 'payment'}
        onClose={() => setPinModal(null)}
        title={user.paymentPinSet ? 'Change Payment PIN' : 'Set Payment PIN'}
        onConfirm={async (pin) => {
          if (user.paymentPinSet) {
            return api.post('/auth/change-payment-pin', { currentPin: pin.current, newPin: pin.next });
          }
          return api.post('/auth/set-payment-pin', { loginPin: pin.current, newPin: pin.next });
        }}
        successMsg="Payment PIN updated."
        toast={toast}
      />

      <Modal open={addMoneyOpen} onClose={() => setAddMoneyOpen(false)} title="Add money (simulated)">
        <div className="form-stack">
          <p className="muted">A mock Razorpay gateway flow. No real payment occurs.</p>
          <label className="field">
            <span>Amount</span>
            <input type="number" min="1" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="e.g. 5000" autoFocus required />
          </label>
          <button type="button" className="btn btn-primary btn-block" onClick={simulateAdd} disabled={busy}>
            {busy ? 'Processing...' : 'Pay via Razorpay (simulated)'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function PinChangeModal({ open, onClose, title, onConfirm, successMsg, toast }) {
  const [step, setStep] = useState(0);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmNext, setConfirmNext] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep(0);
    setCurrent('');
    setNext('');
    setConfirmNext('');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (step === 0) {
      if (!/^\d{4,6}$/.test(current)) { setError('Enter your current PIN.'); return; }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!/^\d{4,6}$/.test(next)) { setError('New PIN must be 4-6 digits.'); return; }
      if (next === current) { setError('New PIN must differ from the current PIN.'); return; }
      setStep(2);
      return;
    }
    if (next !== confirmNext) { setError('PINs do not match.'); return; }
    setBusy(true);
    try {
      await onConfirm({ current, next });
      toast(successMsg, 'success');
      onClose();
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title={title} size="sm">
      <form onSubmit={submit} className="form-stack">
        {step === 0 && (
          <label className="field">
            <span>Current PIN</span>
            <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus required />
          </label>
        )}
        {step === 1 && (
          <label className="field">
            <span>New PIN</span>
            <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" value={next} onChange={(e) => setNext(e.target.value)} autoFocus required />
          </label>
        )}
        {step === 2 && (
          <label className="field">
            <span>Confirm new PIN</span>
            <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} autoFocus required />
          </label>
        )}
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {step === 2 ? (busy ? 'Updating...' : 'Confirm') : 'Continue'}
        </button>
      </form>
    </Modal>
  );
}
