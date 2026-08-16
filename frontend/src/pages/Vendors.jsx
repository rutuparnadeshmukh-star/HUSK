import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatINR, formatDate } from '../utils';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [petty, setPetty] = useState([]);
  const [pay, setPay] = useState(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [pAmount, setPAmount] = useState('');
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get('/vendors').then((d) => setVendors(d.vendors)).catch((e) => toast(e.message, 'error'));
    api.get('/petty-cash').then((d) => setPetty(d.entries)).catch(() => {});
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const confirmPay = async (pin) => {
    await api.post('/vendors/pay', { vendorId: pay.id, name: pay.name, amount: Number(amount), paymentPin: pin });
    toast(`Paid ${pay.name}.`, 'success');
    setPay(null); setAmount('');
    load();
  };
  const addPetty = async (e) => {
    e.preventDefault();
    await api.post('/petty-cash', { desc, amount: Number(pAmount) });
    toast('Petty cash logged.', 'success');
    setDesc(''); setPAmount('');
    load();
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Vendors & petty cash</h1>
          <p className="muted">Pay vendors from the business balance and log petty cash.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Vendor payments</h3></div>
        {vendors.map((v) => (
          <div key={v.id} className="tx-item">
            <span className="tx-icon out">↗</span>
            <div className="tx-meta">
              <strong>{v.name}</strong>
              <span className="muted tiny">{v.category}</span>
            </div>
            <div className="tx-right">
              <span className="muted tiny">pending {formatINR(v.pending)}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPay(v); setAmount(String(v.pending)); }}>Pay</button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Log petty cash</h3></div>
          <form className="form-stack" onSubmit={addPetty}>
            <label className="field"><span>Description</span><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Office snacks, cab…" required /></label>
            <label className="field"><span>Amount (₹)</span><input type="number" min="1" value={pAmount} onChange={(e) => setPAmount(e.target.value)} required /></label>
            <button type="submit" className="btn btn-primary">Log entry</button>
          </form>
        </div>
        <div className="card">
          <div className="card-head"><h3>Petty cash log</h3></div>
          {petty.length === 0 ? (
            <div className="empty-state"><p className="muted">No entries yet.</p></div>
          ) : (
            <div className="tx-list">
              {petty.slice(0, 10).map((p) => (
                <div key={p.id} className="tx-item">
                  <div className="tx-meta"><strong>{p.desc}</strong><span className="muted tiny">{formatDate(p.date)} · {p.by}</span></div>
                  <span className="tx-amount out">−{formatINR(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PaymentPinModal open={!!pay} onClose={() => setPay(null)} onConfirm={confirmPay} amount={Number(amount)} title={`Pay ${pay ? pay.name : ''}`} />
    </div>
  );
}
