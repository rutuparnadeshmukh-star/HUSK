export default function Logo({ size = 40, withText = true, text = 'HUSK' }) {
  return (
    <div className="logo-wrap" style={{ gap: withText ? 10 : 0 }}>
      <img src="/logo.svg" alt="HUSK logo" width={size} height={size} className="logo-img" />
      {withText && <span className="logo-text">{text}</span>}
    </div>
  );
}
