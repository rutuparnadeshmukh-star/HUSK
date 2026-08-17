import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatDate } from '../utils';

export default function Rewards() {
  const [data, setData] = useState(null);
  const [redeem, setRedeem] = useState('');
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get('/points').then(setData).catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const confirmRedeem = async () => {
    const r = await api.post('/points/redeem', { amount: Number(redeem) });
    toast(`Redeemed — ₹${r.cash.toLocaleString('en-IN')} credited`, 'success');
    setRedeem('');
    setShowPin(false);
    load();
  };

  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  const cash = Math.floor(data.points / 50);

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Artham points</h1>
          <p className="muted">Earn 1 point per ₹100 spent. Redeem 50 points = ₹1 cashback.</p>
        </div>
      </div>
      <div className="balance-card">
        <div className="balance-top"><span className="muted">Points balance</span><span className="chip">ARTHAM</span></div>
        <div className="balance-amount">{data.points.toLocaleString('en-IN')} pts</div>
        <div className="balance-stats">
          <div><span className="muted tiny">Cashback value</span><strong>₹{cash.toLocaleString('en-IN')}</strong></div>
          <div><span className="muted tiny">Min redeem</span><strong>50 pts</strong></div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Redeem cashback</h3></div>
          <div className="field">
            <span>Points to redeem (min 50)</span>
            <input type="number" value={redeem} onChange={(e) => setRedeem(e.target.value)} placeholder="50" />
          </div>
          <p className="muted tiny">You will receive ₹{(Number(redeem) / 50 || 0).toLocaleString('en-IN')} into your balance.</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowPin(true)}>Redeem</button>
        </div>
        <div className="card">
          <div className="card-head"><h3>Points history</h3></div>
          {data.log.length === 0 ? (
            <div className="empty-state"><p className="muted">No points activity yet.</p></div>
          ) : (
            <div className="tx-list">
              {data.log.map((l) => (
                <div key={l.id} className="tx-item">
                  <span className={`tx-icon ${l.points > 0 ? 'in' : 'out'}`}>{l.points > 0 ? '↓' : '↑'}</span>
                  <div className="tx-meta">
                    <strong>{l.note}</strong>
                    <span className="muted tiny">{formatDate(l.date)}</span>
                  </div>
                  <span className={`tx-amount ${l.points > 0 ? 'in' : 'out'}`}>{l.points > 0 ? '+' : ''}{l.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PaymentPinModal open={showPin} onClose={() => setShowPin(false)} onConfirm={confirmRedeem} amount={Number(redeem) / 50} title="Redeem points" />
    </div>
  );
}
