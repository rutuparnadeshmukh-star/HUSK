import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatINR, formatDate } from '../utils';

const CATEGORY_TABS = ['All', 'Electricity', 'Water', 'Gas', 'Mobile', 'Broadband', 'Wi-Fi', 'Rent', 'EMI', 'Insurance', 'FASTag'];

export default function Bills() {
  const [catalog, setCatalog] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('All');
  const [payBiller, setPayBiller] = useState(null);
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get('/bills/catalog').then((d) => setCatalog(d.billers)).catch((e) => toast(e.message, 'error'));
    api.get('/bills/history').then((d) => setHistory(d.bills)).catch(() => {});
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const confirmPay = async (pin) => {
    const r = await api.post('/bills/pay', { billerId: payBiller.id, amount: Number(amount) || payBiller.amount, paymentPin: pin });
    toast(`${payBiller.name} paid — earned ${r.points} pts`, 'success');
    setPayBiller(null);
    setAmount('');
    load();
  };

  const list = tab === 'All' ? catalog : catalog.filter((b) => b.category === tab);

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Bill pay & recharges</h1>
          <p className="muted">Electricity, water, gas, mobile, broadband, rent, EMI, insurance and FASTag.</p>
        </div>
      </div>
      <div className="seg">
        {CATEGORY_TABS.map((c) => (
          <button key={c} type="button" className={`seg-btn ${tab === c ? 'active' : ''}`} onClick={() => setTab(c)}>{c}</button>
        ))}
      </div>
      <div className="grid-2">
        {list.map((b) => (
          <div key={b.id} className="bill-card">
            <div>
              <strong>{b.name}</strong>
              <div className="muted tiny">{b.ref} · {b.category}</div>
            </div>
            <div className="bill-right">
              <strong>{formatINR(b.amount)}</strong>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setPayBiller(b); setAmount(String(b.amount)); }}>Pay</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state"><p className="muted">No billers in this category.</p></div>}
      </div>
      {history.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Payment history</h3></div>
          <div className="tx-list">
            {history.slice(0, 8).map((h) => (
              <div key={h.id} className="tx-item">
                <span className="tx-icon out">↗</span>
                <div className="tx-meta">
                  <strong>{h.name}</strong>
                  <span className="muted tiny">{formatDate(h.date)} · {h.category}</span>
                </div>
                <span className="tx-amount out">−{formatINR(h.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <PaymentPinModal
        open={!!payBiller}
        onClose={() => setPayBiller(null)}
        onConfirm={confirmPay}
        amount={Number(amount) || (payBiller ? payBiller.amount : 0)}
        title={`Pay ${payBiller ? payBiller.name : ''}`}
      />
    </div>
  );
}
