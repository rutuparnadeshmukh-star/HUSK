import { useState } from 'react';
import Modal from './Modal';
import PinPad from './PinPad';

export default function PaymentPinModal({ open, onClose, onConfirm, amount, title = 'Confirm with Payment PIN' }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = async (pin) => {
    setBusy(true);
    setError('');
    try {
      await onConfirm(pin);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {amount != null && <p className="payment-amount">{amount}</p>}
      <PinPad
        title="Payment PIN"
        subtitle="This is separate from your login PIN."
        onComplete={handle}
        error={error}
        disabled={busy}
      />
    </Modal>
  );
}
