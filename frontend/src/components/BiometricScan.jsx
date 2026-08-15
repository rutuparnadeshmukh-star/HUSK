import { useEffect, useState } from 'react';

export default function BiometricScan({ onSuccess, onCancel, status = 'Scanning your fingerprint...' }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setStage((s) => (s + 1) % 4), 700);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="biometric-scan">
      <div className="fingerprint-wrap">
        <svg width="110" height="110" viewBox="0 0 110 110" className="fingerprint-svg">
          <g
            stroke="var(--primary)"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
            opacity={stage >= 0 ? 1 : 0}
          >
            <path d="M32 55a23 23 0 0 1 46 0" />
            <path d="M25 55a30 30 0 0 1 60 0" />
            <path d="M55 55a0 0 0 0 0 0 0" opacity="0" />
            <path d="M38 55a17 17 0 0 1 34 0" />
            <path d="M55 55v20" />
            <path d="M44 63a11 11 0 0 1 22 0" />
            <path d="M55 45a6 6 0 0 1 6 6v14" />
          </g>
          <circle
            cx="55"
            cy="55"
            r="48"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeDasharray="301"
            strokeDashoffset={301 - (stage / 3) * 301}
            strokeLinecap="round"
            className="scan-ring"
          />
        </svg>
      </div>
      <p className="scan-status">{status}</p>
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        Use PIN instead
      </button>
    </div>
  );
}
