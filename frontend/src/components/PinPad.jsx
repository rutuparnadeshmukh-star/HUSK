import { useEffect, useRef, useState } from 'react';

export default function PinPad({ title = 'Enter PIN', subtitle, onComplete, error, locked, lockSeconds, disabled }) {
  const [pin, setPin] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (pin.length === 6) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onComplete(pin);
        setPin('');
      }, 200);
    }
  }, [pin, onComplete]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const press = (d) => {
    if (disabled || locked || pin.length >= 6) return;
    setPin((p) => p + d);
  };

  const backspace = () => {
    if (disabled || locked) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <div className="pin-pad">
      <div className="pin-dots" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`dot ${pin.length > i ? 'filled' : ''}`} />
        ))}
      </div>
      <h3 className="pin-title">{title}</h3>
      {subtitle && <p className="muted pin-subtitle">{subtitle}</p>}
      {error && <p className="form-error">{error}</p>}
      {locked && (
        <p className="form-error">
          Account locked. Try again in {Math.ceil(lockSeconds / 60)} minute(s).
        </p>
      )}
      <div className="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'biometric', '0', 'back'].map((key, i) => (
          <button
            key={i}
            type="button"
            className={`key ${key === 'biometric' ? 'key-biometric' : ''} ${key === 'back' ? 'key-back' : ''}`}
            onClick={() => {
              if (key === 'biometric') return;
              if (key === 'back') backspace();
              else press(key);
            }}
            disabled={disabled || locked}
            aria-label={key === 'back' ? 'Delete digit' : key === 'biometric' ? 'Biometric' : `Digit ${key}`}
          >
            {key === 'biometric' ? 'F' : key === 'back' ? '⌫' : key}
          </button>
        ))}
      </div>
    </div>
  );
}
