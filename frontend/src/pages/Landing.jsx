import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const FEATURES = [
  { title: 'Expense tracking', desc: 'Understand your spending with a clear donut breakdown.', icon: '◎' },
  { title: 'Invest with live charts', desc: 'Simulated candlestick & performance graphs.', icon: '⌁' },
  { title: 'Price comparison', desc: 'Find the best price across mock retailers instantly.', icon: '≣' },
  { title: 'Business controls', desc: 'Owner permissions, spend limits and a full audit log.', icon: '♟' }
];

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Logo size={40} />
        <div className="landing-actions">
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Get started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">Secured with PIN + biometric verification</div>
        <h1>
          Banking, invest & pay — <span className="gradient">all in ARTHAM</span>
        </h1>
        <p className="hero-sub">
          Manage personal and business money with PIN-first security, spend limits, expense insights and simulated markets.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">Create free account</Link>
          <Link to="/login" className="btn btn-ghost btn-lg">Welcome back</Link>
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p className="muted">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="security-strip">
        <div className="security-item"><strong>bcrypt</strong><span className="muted tiny">PIN hashing</span></div>
        <div className="security-item"><strong>JWT</strong><span className="muted tiny">Short-lived sessions</span></div>
        <div className="security-item"><strong>Rate limited</strong><span className="muted tiny">PIN & OTP attempts</span></div>
        <div className="security-item"><strong>Webhook</strong><span className="muted tiny">Signature verified</span></div>
      </section>

      <footer className="landing-foot">
        <Logo size={20} withText={false} /> <span className="muted tiny">ARTHAM — a demo banking app. All data is simulated.</span>
      </footer>
    </div>
  );
}
