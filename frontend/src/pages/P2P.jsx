import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PaymentPinModal from '../components/PaymentPinModal';
import { formatINR } from '../utils';

export default function P2P() {
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  const loadContacts = useCallback(() => {
    api.get('/p2p/contacts').then((d) => setContacts(d.contacts)).catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const loadChat = useCallback((withId) => {
    api.get(`/p2p/chat?with=${withId}`).then((d) => setMessages(d.messages)).catch(() => {});
  }, []);

  useEffect(() => {
    if (active) loadChat(active.id);
  }, [active, loadChat]);

  const sendMsg = async () => {
    if (!text.trim() || !active) return;
    await api.post('/p2p/message', { to: active.id, text });
    setText('');
    loadChat(active.id);
  };

  const confirmPay = async (pin) => {
    const r = await api.post('/p2p/send', { to: active.id, amount: Number(payAmount), note: text.trim() || 'Payment', paymentPin: pin });
    toast(`Paid ${active.name} — earned ${r.points} pts`, 'success');
    setPayAmount('');
    setShowPin(false);
    loadChat(active.id);
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>P2P transfers</h1>
          <p className="muted">Send money and chat with your contacts.</p>
        </div>
      </div>
      <div className="p2p-layout">
        <div className="card p2p-contacts">
          <div className="card-head"><h3>Contacts</h3></div>
          {contacts.map((c) => (
            <button key={c.id} type="button" className={`contact-row ${active && active.id === c.id ? 'active' : ''}`} onClick={() => setActive(c)}>
              <span className="avatar">{c.name.charAt(0)}</span>
              <span>
                <strong>{c.name}</strong>
                <span className="muted tiny">{c.upi}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="card p2p-chat">
          {!active ? (
            <div className="empty-state"><p className="muted">Select a contact to start.</p></div>
          ) : (
            <>
              <div className="card-head">
                <h3>{active.name}</h3>
                <span className="muted tiny">{active.upi}</span>
              </div>
              <div className="chat-thread">
                {messages.length === 0 && <p className="muted tiny chat-empty">No messages yet. Say hi!</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`chat-bubble ${m.from === active.id ? 'in' : 'out'}`}>
                    <div>{m.text}</div>
                    <span className="muted tiny">{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" onKeyDown={(e) => e.key === 'Enter' && sendMsg()} />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowPin(true)}>Pay {formatINR(Number(payAmount) || 0)}</button>
              </div>
              <div className="chat-amount">
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (₹)" className="amount-input" />
              </div>
            </>
          )}
        </div>
      </div>
      <PaymentPinModal open={showPin} onClose={() => setShowPin(false)} onConfirm={confirmPay} amount={Number(payAmount)} title={`Send to ${active ? active.name : ''}`} />
    </div>
  );
}
