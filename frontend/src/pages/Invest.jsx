import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import CandlestickChart from '../components/CandlestickChart';
import LineChart from '../components/LineChart';
import Modal from '../components/Modal';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatINR } from '../utils';

const TABS = [
  { key: 'stocks', label: 'Stocks', field: 'stocks' },
  { key: 'forex', label: 'Forex', field: 'forex' },
  { key: 'gold', label: 'Gold', field: 'gold' },
  { key: 'mf', label: 'Mutual funds', field: 'mutualFunds' },
  { key: 'sip', label: 'SIPs', field: 'sips' }
];

export default function Invest() {
  const [tab, setTab] = useState('stocks');
  const [opps, setOpps] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [selected, setSelected] = useState('');
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buyAction, setBuyAction] = useState(null);
  const [sellAction, setSellAction] = useState(null);
  const { toast } = useToast();

  const loadOpps = useCallback(() => {
    api.get('/invest/opportunities').then(setOpps).catch(() => {});
  }, []);
  const loadPortfolio = useCallback(() => {
    api.get('/invest/portfolio').then(setPortfolio).catch(() => {});
  }, []);

  useEffect(() => { loadOpps(); loadPortfolio(); }, [loadOpps, loadPortfolio]);

  const activeTab = TABS.find((t) => t.key === tab);
  const items = opps && activeTab ? opps[activeTab.field] || [] : [];

  const select = (symbol) => {
    setSelected(symbol);
    setLoading(true);
    api.get(`/invest/market/${tab}?symbol=${symbol}`).then(setChart).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (items.length && !items.some((i) => i.symbol === selected)) select(items[0].symbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, items.length]);

  const refresh = () => { loadOpps(); loadPortfolio(); if (selected) select(selected); };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Invest</h1>
          <p className="muted">Stocks, forex, mutual funds, SIPs and digital gold — simulated markets.</p>
        </div>
      </div>
      <div className="seg">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`seg-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>{activeTab.label} watchlist</h3></div>
          <div className="stock-list">
            {items.map((s) => (
              <button key={s.symbol} type="button" className={`stock-row ${selected === s.symbol ? 'active' : ''}`} onClick={() => select(s.symbol)}>
                <span className="stock-name">
                  <strong>{s.symbol}</strong>
                  <span className="muted tiny">{s.name}{s.min ? ` · min ₹${s.min}` : ''}</span>
                </span>
                <span className="stock-price">
                  <strong>{formatINR(s.price)}</strong>
                  <span className="muted tiny">{s.nav ? 'NAV' : 'price'}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>{chart ? chart.item.name : selected} — candlesticks</h3>
            {chart && <span className="up">{formatINR(chart.item.price)}</span>}
          </div>
          {loading ? (
            <div className="center-pad"><div className="spinner" /></div>
          ) : chart ? (
            <>
              <CandlestickChart data={chart.candles} />
              {tab === 'stocks' ? (
                <div className="buy-row">
                  <button type="button" className="btn btn-primary" onClick={() => setBuyAction({ symbol: chart.item.symbol, price: chart.item.price })}>
                    Buy {chart.item.symbol}
                  </button>
                </div>
              ) : (
                <p className="muted tiny">This asset is watch-only in the demo. Stocks support simulated buy/sell.</p>
              )}
            </>
          ) : null}
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <h3>Your portfolio</h3>
          {portfolio && <span className="muted">Total value {formatINR(portfolio.totalValue)}</span>}
        </div>
        {portfolio && portfolio.portfolio.length > 0 && (
          <div className="portfolio-chart">
            <LineChart data={portfolio.history.map((h) => ({ date: h.date, value: h.value }))} height={200} stroke="var(--primary)" />
          </div>
        )}
        {portfolio && portfolio.portfolio.length === 0 ? (
          <div className="empty-state"><p className="muted">No holdings yet. Buy your first stock above.</p></div>
        ) : (
          <div className="tx-list">
            {portfolio && portfolio.portfolio.map((p) => (
              <div key={p.symbol} className="tx-item">
                <span className="tx-icon in">⌁</span>
                <div className="tx-meta">
                  <strong>{p.symbol}</strong>
                  <span className="muted tiny">{p.shares.toFixed(4)} shares @ {formatINR(p.avgPrice)}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${p.changePct >= 0 ? 'in' : 'out'}`}>{p.changePct >= 0 ? '+' : ''}{p.changePct}%</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSellAction(p)}>Sell</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {buyAction && (
        <BuyFlow action={buyAction} onClose={() => setBuyAction(null)} onDone={() => { toast('Investment made.', 'success'); refresh(); }} />
      )}
      {sellAction && (
        <SellFlow holding={sellAction} onClose={() => setSellAction(null)} onDone={() => { toast('Shares sold.', 'success'); refresh(); }} />
      )}
    </div>
  );
}

function BuyFlow({ action, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <PaymentPinModal
        open
        onClose={onClose}
        amount={formatINR(Number(amount))}
        title={`Buy ${action.symbol}`}
        onConfirm={async (pin) => {
          await api.post('/invest/buy', { symbol: action.symbol, amount: Number(amount), paymentPin: pin });
          onDone();
        }}
      />
    );
  }
  return (
    <Modal open onClose={onClose} title={`Buy ${action.symbol}`}>
      <form className="form-stack" onSubmit={(e) => { e.preventDefault(); if (!amount || Number(amount) <= 0) return; setConfirm(true); }}>
        <p className="muted">Current price: <strong>{formatINR(action.price)}</strong></p>
        <label className="field">
          <span>Amount to invest</span>
          <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000" autoFocus required />
        </label>
        <button type="submit" className="btn btn-primary btn-block">Continue to Payment PIN</button>
      </form>
    </Modal>
  );
}

function SellFlow({ holding, onClose, onDone }) {
  const [shares, setShares] = useState('');
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <PaymentPinModal
        open
        onClose={onClose}
        title={`Sell ${holding.symbol}`}
        onConfirm={async (pin) => {
          await api.post('/invest/sell', { symbol: holding.symbol, shares: Number(shares), paymentPin: pin });
          onDone();
        }}
      />
    );
  }
  return (
    <Modal open onClose={onClose} title={`Sell ${holding.symbol}`}>
      <form className="form-stack" onSubmit={(e) => { e.preventDefault(); if (!shares || Number(shares) <= 0 || Number(shares) > holding.shares) return; setConfirm(true); }}>
        <p className="muted">Holdings: {holding.shares.toFixed(4)} shares</p>
        <label className="field">
          <span>Shares to sell</span>
          <input type="number" min="0.0001" step="0.0001" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="e.g. 5" autoFocus required />
        </label>
        <button type="submit" className="btn btn-primary btn-block">Continue to Payment PIN</button>
      </form>
    </Modal>
  );
}
