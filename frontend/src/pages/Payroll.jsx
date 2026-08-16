import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatINR, formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';

export default function Payroll() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showRun, setShowRun] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    api.get('/payslips').then((d) => setPayslips(d.payslips)).catch((e) => toast(e.message, 'error'));
    api.get('/business/employees').then((d) => setEmployees(d.employees || d.users || [])).catch(() => {});
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const isOwner = user && user.role === 'owner';
  const genPayslip = async (emp) => {
    await api.post('/payslips/generate', { employeeId: emp.id });
    toast(`Payslip generated for ${emp.name}.`, 'success');
    load();
  };
  const runSalary = async () => {
    const r = await api.post('/salary/run');
    toast(`Salaries paid — ${r.paid.length} employees, total ${formatINR(r.total)}`, 'success');
    setShowRun(false);
    load();
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Payroll</h1>
          <p className="muted">Generate payslips and run the simulated monthly salary payout.</p>
        </div>
      </div>
      {isOwner && (
        <>
          <div className="card">
            <div className="card-head">
              <h3>Employees</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowRun(true)}>Run salary</button>
            </div>
            {employees.length === 0 ? (
              <div className="empty-state"><p className="muted">No employees yet. Add them under Manage access.</p></div>
            ) : (
              <div className="tx-list">
                {employees.filter((e) => e.role === 'employee').map((e) => (
                  <div key={e.id} className="tx-item">
                    <div className="tx-meta">
                      <strong>{e.name} <span className="muted">@{e.username}</span></strong>
                      <span className="muted tiny">salary {formatINR(e.salary || 40000)}/mo</span>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => genPayslip(e)}>Payslip</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <PaymentPinModal open={showRun} onClose={() => setShowRun(false)} onConfirm={runSalary} title="Run monthly salary" />
        </>
      )}
      <div className="card">
        <div className="card-head"><h3>Payslips</h3></div>
        {payslips.length === 0 ? (
          <div className="empty-state"><p className="muted">No payslips generated yet.</p></div>
        ) : (
          <div className="tx-list">
            {payslips.map((p) => (
              <div key={p.id} className="tx-item">
                <span className="tx-icon in">↓</span>
                <div className="tx-meta">
                  <strong>{p.employeeName} · {p.period}</strong>
                  <span className="muted tiny">Gross {formatINR(p.gross)} · PF {formatINR(p.pf)} · Tax {formatINR(p.tax)}</span>
                </div>
                <span className="tx-amount in">Net {formatINR(p.net)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {payslips.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Latest payslip detail</h3></div>
          {(() => { const p = payslips[0]; return (
            <div className="profile-stack">
              <div className="profile-row"><span className="muted">Employee</span><strong>{p.employeeName}</strong></div>
              <div className="profile-row"><span className="muted">Period</span><strong>{p.period}</strong></div>
              <div className="profile-row"><span className="muted">Basic</span><strong>{formatINR(p.basic)}</strong></div>
              <div className="profile-row"><span className="muted">HRA</span><strong>{formatINR(p.hra)}</strong></div>
              <div className="profile-row"><span className="muted">Provident fund</span><strong>−{formatINR(p.pf)}</strong></div>
              <div className="profile-row"><span className="muted">Tax</span><strong>−{formatINR(p.tax)}</strong></div>
              <div className="profile-row total"><span className="muted">Net pay</span><strong>{formatINR(p.net)}</strong></div>
            </div>
          ); })()}
        </div>
      )}
    </div>
  );
}
