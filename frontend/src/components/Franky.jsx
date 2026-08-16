import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export default function Franky() {
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chats, open]);

  const send = async () => {
    if (!text.trim() || busy) return;
    const q = text;
    setText('');
    setBusy(true);
    setChats((c) => [...c, { role: 'user', text: q }]);
    try {
      const r = await api.post('/ai/franky', { message: q });
      setChats((c) => [...c, { role: 'assistant', text: r.reply }]);
    } catch {
      setChats((c) => [...c, { role: 'assistant', text: 'I hit a snag. Try again in a moment.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="franky-fab" onClick={() => setOpen((o) => !o)} aria-label="Ask Franky">
        {open ? '×' : 'F'}
      </button>
      {open && (
        <div className="franky-panel">
          <div className="franky-head">
            <div className="franky-avatar">F</div>
            <div>
              <strong>Franky</strong>
              <span className="muted tiny">HUSK AI assistant · scripted</span>
            </div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="franky-body">
            {chats.length === 0 && (
              <div className="franky-hint">
                <p>Hi! I am Franky. Ask me about:</p>
                <div className="seg">
                  {['balance', 'send money', 'bills', 'invest', 'budget', 'points'].map((s) => (
                    <button key={s} type="button" className="seg-btn" onClick={() => { setText(s); }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {chats.map((c, i) => (
              <div key={i} className={`franky-msg ${c.role}`}><span>{c.text}</span></div>
            ))}
            {busy && <div className="franky-msg assistant"><span>…</span></div>}
            <div ref={bottomRef} />
          </div>
          <div className="franky-input">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask Franky…" onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button type="button" className="btn btn-primary btn-sm" onClick={send}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
