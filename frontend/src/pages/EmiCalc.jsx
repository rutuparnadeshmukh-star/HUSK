import { useState } from 'react';
import { api } from '../api';
import { formatINR } from '../utils';

export default function EmiCalc() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(10.5);
  const [months, setMonths] = useState(24);
  const [res, setRes] = useState(null);

  const calc = async () => {
    const d = await api.get(`/emi-calc?amount=${amount}&rate=${rate}&months=${months}`);
    setRes(d);
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>EMI calculator</h1>
          <p className="muted">Estimate your monthly loan payments.</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="field">
            <span>Loan amount (₹)</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="field">
            <span>Annual interest rate (%)</span>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div className="field">
            <span>Tenure (months)</span>
            <input type="number" value={months} onChange={(e) => setMonths(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" onClick={calc}>Calculate</button>
        </div>
        <div className="card">
          <div className="card-head"><h3>Result</h3></div>
          {!res ? (
            <div className="empty-state"><p className="muted">Set values and press Calculate.</p></div>
          ) : (
            <div className="profile-stack">
              <div className="profile-row"><span className="muted">Monthly EMI</span><strong className="big">{formatINR(res.emi)}</strong></div>
              <div className="profile-row"><span className="muted">Total payment</span><strong>{formatINR(res.totalPayment)}</strong></div>
              <div className="profile-row"><span className="muted">Total interest</span><strong>{formatINR(res.totalInterest)}</strong></div>
              <div className="limit-bar">
                <div className="limit-track"><div className="limit-fill" style={{ width: `${Math.min(100, (res.totalInterest / res.totalPayment) * 100)}%` }} /></div>
              </div>
              <p className="muted tiny">Interest makes up {Math.round((res.totalInterest / res.totalPayment) * 100)}% of the total repayment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
