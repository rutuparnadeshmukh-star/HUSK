const { genId, nowIso } = require('./store');
const { BANKS, STOCKS } = require('./mockdata');

function daysAgo(n, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function pushTx(db, userId, tx) {
  db.transactions.push({ id: genId('tx'), userId, actorId: userId, businessId: null, status: 'completed', method: 'UPI (simulated)', ...tx });
}

function seedPersonalUser(db, user) {
  user.balance = 86838;
  user.points = 320;
  user.pointLog = [
    { id: genId('pt'), points: 120, note: 'Welcome bonus points', date: daysAgo(0, 9) },
    { id: genId('pt'), points: 200, note: 'Sign-up reward', date: daysAgo(0, 10) }
  ];

  pushTx(db, user.id, { direction: 'in', type: 'salary', to: 'Acme Corp · Salary', amount: 65000, note: 'Monthly salary credit', date: daysAgo(2, 9) });
  pushTx(db, user.id, { direction: 'in', type: 'refund', to: 'Flipkart', amount: 1299, note: 'Order refund', date: daysAgo(3, 15) });
  pushTx(db, user.id, { direction: 'out', type: 'shopping', to: 'Amazon India', amount: 3499, note: 'Wireless headphones', date: daysAgo(1, 18) });
  pushTx(db, user.id, { direction: 'out', type: 'food', to: 'Swiggy', amount: 642, note: 'Lunch order', date: daysAgo(0, 13) });
  pushTx(db, user.id, { direction: 'out', type: 'transport', to: 'Uber', amount: 320, note: 'Ride to office', date: daysAgo(0, 8) });
  pushTx(db, user.id, { direction: 'out', type: 'entertainment', to: 'Netflix', amount: 499, note: 'Monthly subscription', date: daysAgo(4, 20) });
  pushTx(db, user.id, { direction: 'in', type: 'cashback', to: 'HUSK Rewards', amount: 150, note: 'Cashback earned', date: daysAgo(1, 21) });

  const expenses = [
    ['Food', 642, 'Swiggy lunch', daysAgo(0, 13)],
    ['Food', 210, 'Cafe coffee', daysAgo(1, 10)],
    ['Transport', 320, 'Uber ride', daysAgo(0, 8)],
    ['Transport', 400, 'Fuel', daysAgo(2, 9)],
    ['Shopping', 3499, 'Amazon headphones', daysAgo(1, 18)],
    ['Shopping', 899, 'Myntra t-shirt', daysAgo(5, 16)],
    ['Entertainment', 499, 'Netflix', daysAgo(4, 20)],
    ['Travel', 2400, 'Metro recharge', daysAgo(3, 11)],
    ['Bills & Utilities', 1049, 'Electricity bill', daysAgo(2, 14)],
    ['Health', 350, 'Pharmacy', daysAgo(6, 19)]
  ];
  expenses.forEach(([category, amount, note, date]) => {
    db.expenses.push({ id: genId('exp'), userId: user.id, category, amount, note, date });
  });

  const bank = BANKS[0];
  db.bankLinks.push({
    id: genId('bnk'),
    userId: user.id,
    bankId: bank.id,
    bankName: bank.name,
    bankColor: bank.color,
    last4: '4821',
    holderName: user.name,
    balance: 52100
  });

  const portfolioDefs = [
    { symbol: 'RELIANCE', shares: 12, avgPrice: 2450, buyAmount: 29400 },
    { symbol: 'TCS', shares: 5, avgPrice: 3560, buyAmount: 17800 },
    { symbol: 'INFY', shares: 20, avgPrice: 1420, buyAmount: 28400 }
  ];
  portfolioDefs.forEach((p) => {
    db.portfolio.push({ id: genId('pf'), userId: user.id, ...p });
  });

  user.notifications = [
    { id: genId('ntf'), title: 'Salary credited', body: '₹65,000 credited to your HUSK account.', time: daysAgo(2, 9), read: false },
    { id: genId('ntf'), title: 'Security tip', body: 'Biometric login is on. Your PIN is never skipped.', time: daysAgo(1, 10), read: false },
    { id: genId('ntf'), title: 'Cashback earned', body: 'You earned ₹150 cashback this week.', time: daysAgo(1, 21), read: true }
  ];
}

function seedBusinessUser(db, user) {
  if (user.role !== 'owner') {
    const owner = db.users.find((u) => u.id === user.ownerId);
    const biz = owner ? owner.name : 'your business';
    user.notifications = [
      { id: genId('ntf'), title: 'Welcome to the team', body: `You can now spend under ${biz} with set limits.`, time: nowIso(), read: false }
    ];
    return;
  }
  pushTx(db, user.id, { direction: 'in', type: 'revenue', to: 'Client Invoice #INV-2041', amount: 120000, note: 'Invoice payment received', date: daysAgo(1, 14) });
  pushTx(db, user.id, { direction: 'out', type: 'operations', to: 'Cloud provider', amount: 24000, note: 'Infrastructure bill', date: daysAgo(2, 11) });
  user.balance = Math.round((user.balance + 120000 - 24000) * 100) / 100;
  user.notifications = [
    { id: genId('ntf'), title: 'Payment received', body: '₹1,20,000 received from Client Invoice #INV-2041.', time: daysAgo(1, 14), read: false },
    { id: genId('ntf'), title: 'Employee controls active', body: 'Spend limits and the audit log are protecting your business.', time: daysAgo(0, 9), read: false }
  ];
}

function seedUserData(db, user) {
  if (user.mode === 'business') {
    seedBusinessUser(db, user);
  } else {
    seedPersonalUser(db, user);
  }
}

module.exports = { seedUserData };
