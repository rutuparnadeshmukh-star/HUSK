import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import PinPad from '../components/PinPad';
import BiometricScan from '../components/BiometricScan';

export default function Login() {
  const { user, ready, login, completeBiometric } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [step, setStep] = useState('pin');
  const [pendingAuth, setPendingAuth] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    if (ready && user) {
      navigate(user.mode === 'business' ? '/app/business' : '/app/personal', { replace: true });
    }
  }, [ready, user, navigate]);

  useEffect(() => {
    if (step !== 'biometric') return;
    const t = setTimeout(() => {
      handleBiometric();
    }, 2600);
    return () => clearTimeout(t);
  }, [step]);

  const handlePin = async (pin) => {
    if (!username.trim()) {
      setError('Enter your username first.');
      return;
    }
    setBusy(true);
    setError('');
    setLocked(false);
    try {
      const result = await login(username.trim(), pin, navigator.userAgent || 'Web browser');
      if (result.biometricRequired) {
        setPendingAuth(result.pendingAuth);
        setStep('biometric');
        toast('Biometric verification required.', 'info');
      } else {
        toast(`Welcome back, ${result.user.name}!`, 'success');
        navigate(result.user.mode === 'business' ? '/app/business' : '/app/personal');
      }
    } catch (e) {
      setError(e.message || 'Login failed.');
      if (e.status === 429 || e.locked) {
        setLocked(true);
        setLockSeconds(e.lockSeconds || 900);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBiometric = async () => {
    setBusy(true);
    try {
      const u = await completeBiometric(pendingAuth);
      toast(`Biometric verified. Welcome back, ${u.name}!`, 'success');
      navigate(u.mode === 'business' ? '/app/business' : '/app/personal');
    } catch (e) {
      setError(e.message);
      setStep('pin');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo size={56} />
        </div>
        {step === 'pin' ? (
          <>
            <h2 className="auth-title">Welcome back</h2>
            <p className="muted auth-sub">Log in to your HUSK account</p>
            <div className="auth-username">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                autoFocus
              />
            </div>
            <PinPad
              title="Enter your PIN"
              subtitle="Your PIN is always required for login."
              onComplete={handlePin}
              error={error}
              locked={locked}
              lockSeconds={lockSeconds}
              disabled={busy}
            />
            <p className="auth-foot">
              New to HUSK? <Link to="/register">Create an account</Link>
            </p>
          </>
        ) : (
          <>
            <h2 className="auth-title">Biometric check</h2>
            <p className="muted auth-sub">Confirm it's you to finish logging in</p>
            <BiometricScan
              status={busy ? 'Verifying fingerprint...' : 'Scanning your fingerprint...'}
              onSuccess={handleBiometric}
              onCancel={() => {
                setError('');
                setStep('pin');
              }}
            />
            {error && <p className="form-error">{error}</p>}
          </>
        )}
      </div>
      <footer className="auth-footer">
        <Logo size={18} withText={false} /> <span className="muted tiny">Banking, invest & pay. Secured by design.</span>
      </footer>
    </div>
  );
}
