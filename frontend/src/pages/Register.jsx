import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';

const MODES = [
  {
    id: 'personal',
    title: 'Personal',
    desc: 'Track expenses, invest and manage your money',
    features: ['Expense tracking', 'Invest & charts', 'Price comparison', 'Bank linking']
  },
  {
    id: 'business',
    title: 'Business',
    desc: 'Manage employees, limits and business money',
    features: ['Employee access control', 'Spend limits', 'Audit log', 'Instant revocation']
  }
];

export default function Register() {
  const { user, ready, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState('personal');
  const [role, setRole] = useState('owner');
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    pin: '',
    paymentPin: '',
    biometricEnabled: false,
    ownerCode: '',
    employeeDailyLimit: '50000',
    employeeTxnLimit: '20000'
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (ready && user) {
      navigate(user.mode === 'business' ? '/app/business' : '/app/personal', { replace: true });
    }
  }, [ready, user, navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setChecked = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!/^\d{4,6}$/.test(form.pin)) {
        throw new Error('Login PIN must be 4-6 digits.');
      }
      if (!/^\d{4,6}$/.test(form.paymentPin || '')) {
        throw new Error('A Payment PIN (4-6 digits) is required for every transaction. It must differ from your login PIN.');
      }
      if (form.paymentPin === form.pin) {
        throw new Error('Payment PIN must be different from your login PIN.');
      }
      if (mode === 'business' && role === 'employee' && !form.ownerCode.trim()) {
        throw new Error('Enter the business code provided by the owner.');
      }
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        pin: form.pin,
        paymentPin: form.paymentPin || null,
        biometricEnabled: form.biometricEnabled,
        mode,
        role: mode === 'business' ? role : 'owner',
        ownerCode: form.ownerCode,
        employeeDailyLimit: Number(form.employeeDailyLimit),
        employeeTxnLimit: Number(form.employeeTxnLimit),
        device: navigator.userAgent || 'Web browser'
      };
      const u = await register(payload);
      toast(`Account created. Welcome to ARTHAM, ${u.user.name}!`, 'success');
      if (u.user.role === 'owner' && u.user.mode === 'business' && u.employeeCode) {
        setCreated({ employeeCode: u.employeeCode });
        return;
      }
      navigate(u.user.mode === 'business' ? '/app/business' : '/app/personal');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">
            <Logo size={56} />
          </div>
          <h2 className="auth-title">Business created!</h2>
          <p className="muted auth-sub">
            Share this code with employees so they can join your business. You can also view it in Settings.
          </p>
          <div className="business-code">{created.employeeCode}</div>
          <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/app/business')}>
            Go to Business Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <Logo size={56} />
        </div>
        <h2 className="auth-title">Create your account</h2>
        <p className="muted auth-sub">Start banking securely with ARTHAM</p>

        <div className="mode-tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-tab ${mode === m.id ? 'active' : ''}`}
              onClick={() => {
                setMode(m.id);
                setRole('owner');
                setError('');
              }}
            >
              <strong>{m.title}</strong>
              <span className="muted tiny">{m.desc}</span>
            </button>
          ))}
        </div>

        {mode === 'business' && (
          <div className="seg">
            <button type="button" className={`seg-btn ${role === 'owner' ? 'active' : ''}`} onClick={() => setRole('owner')}>
              I'm the Owner
            </button>
            <button type="button" className={`seg-btn ${role === 'employee' ? 'active' : ''}`} onClick={() => setRole('employee')}>
              I'm an Employee
            </button>
          </div>
        )}

        <form onSubmit={submit} className="form-stack">
          <label className="field">
            <span>{mode === 'business' && role === 'owner' ? 'Business name' : 'Full name'}</span>
            <input value={form.name} onChange={set('name')} placeholder={mode === 'business' && role === 'owner' ? 'Your business name' : 'Your full name'} required />
          </label>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={set('username')} placeholder="3-30 characters" autoComplete="username" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" required />
          </label>
          {mode === 'business' && role === 'employee' && (
            <label className="field">
              <span>Business code</span>
              <input value={form.ownerCode} onChange={set('ownerCode')} placeholder="Code from your business owner" required />
            </label>
          )}
          <div className="field-row">
            <label className="field">
              <span>Login PIN (4-6 digits)</span>
              <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" value={form.pin} onChange={set('pin')} placeholder="Always required" required />
            </label>
            <label className="field">
              <span>Payment PIN (4-6 digits)</span>
              <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" value={form.paymentPin} onChange={set('paymentPin')} placeholder="Separate from login" required />
            </label>
          </div>
          {mode === 'business' && role === 'owner' && (
            <div className="field-row">
              <label className="field">
                <span>Default daily limit per employee</span>
                <input type="number" min="1" value={form.employeeDailyLimit} onChange={set('employeeDailyLimit')} />
              </label>
              <label className="field">
                <span>Default per-transaction limit</span>
                <input type="number" min="1" value={form.employeeTxnLimit} onChange={set('employeeTxnLimit')} />
              </label>
            </div>
          )}
          <label className="checkbox-row">
            <input type="checkbox" checked={form.biometricEnabled} onChange={setChecked('biometricEnabled')} />
            <span>
              Enable biometric login <span className="muted tiny">(fingerprint scan after PIN — PIN is always required)</span>
            </span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="auth-foot">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
      <footer className="auth-footer">
        <Logo size={18} withText={false} /> <span className="muted tiny">Banking, invest & pay. Secured by design.</span>
      </footer>
    </div>
  );
}
