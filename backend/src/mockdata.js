const PRODUCTS = [
  { id: 'p1', name: 'iPhone 15 Pro', category: 'Electronics', tag: 'PH', retailers: [
    { name: 'TechWorld', price: 124999 },
    { name: 'GadgetHub', price: 127999 },
    { name: 'ElectroMart', price: 123999 },
    { name: 'MegaStore', price: 126499 }
  ]},
  { id: 'p2', name: 'Samsung Galaxy S24', category: 'Electronics', tag: 'GS', retailers: [
    { name: 'TechWorld', price: 89999 },
    { name: 'GadgetHub', price: 87999 },
    { name: 'ElectroMart', price: 90999 },
    { name: 'MegaStore', price: 88500 }
  ]},
  { id: 'p3', name: 'MacBook Air M3', category: 'Electronics', tag: 'MB', retailers: [
    { name: 'TechWorld', price: 114900 },
    { name: 'GadgetHub', price: 116900 },
    { name: 'ElectroMart', price: 114499 },
    { name: 'MegaStore', price: 118499 }
  ]},
  { id: 'p4', name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', tag: 'SN', retailers: [
    { name: 'TechWorld', price: 28990 },
    { name: 'GadgetHub', price: 29999 },
    { name: 'ElectroMart', price: 27999 },
    { name: 'MegaStore', price: 28500 }
  ]},
  { id: 'p5', name: 'Nike Air Zoom Pegasus', category: 'Fashion', tag: 'NK', retailers: [
    { name: 'ShoeSpot', price: 9495 },
    { name: 'FootLocker', price: 9995 },
    { name: 'SportMax', price: 9199 },
    { name: 'UrbanKart', price: 9299 }
  ]},
  { id: 'p6', name: "Levi's 501 Jeans", category: 'Fashion', tag: 'LV', retailers: [
    { name: 'FashionWorld', price: 3499 },
    { name: 'UrbanKart', price: 3299 },
    { name: 'StyleBazaar', price: 3599 },
    { name: 'WardrobePlus', price: 3399 }
  ]},
  { id: 'p7', name: 'Ray-Ban Wayfarer Sunglasses', category: 'Fashion', tag: 'RB', retailers: [
    { name: 'FashionWorld', price: 7999 },
    { name: 'UrbanKart', price: 7499 },
    { name: 'StyleBazaar', price: 8299 },
    { name: 'WardrobePlus', price: 7699 }
  ]},
  { id: 'p8', name: 'Dyson V15 Vacuum', category: 'Home', tag: 'DY', retailers: [
    { name: 'HomePlus', price: 54900 },
    { name: 'ElectroMart', price: 53500 },
    { name: 'MegaStore', price: 55999 },
    { name: 'FreshHome', price: 54200 }
  ]},
  { id: 'p9', name: 'Philips Air Fryer', category: 'Home', tag: 'PA', retailers: [
    { name: 'HomePlus', price: 8999 },
    { name: 'ElectroMart', price: 8499 },
    { name: 'MegaStore', price: 9299 },
    { name: 'FreshHome', price: 8699 }
  ]},
  { id: 'p10', name: 'IKEA Poang Chair', category: 'Home', tag: 'IK', retailers: [
    { name: 'HomePlus', price: 5499 },
    { name: 'FreshHome', price: 5199 },
    { name: 'StyleBazaar', price: 5799 },
    { name: 'UrbanKart', price: 5399 }
  ]},
  { id: 'p11', name: 'Dyson Airwrap Styler', category: 'Beauty', tag: 'DA', retailers: [
    { name: 'GlamStore', price: 44900 },
    { name: 'UrbanKart', price: 43500 },
    { name: 'StyleBazaar', price: 45999 },
    { name: 'BeautyBoutique', price: 44200 }
  ]},
  { id: 'p12', name: 'Kindle Paperwhite', category: 'Books', tag: 'KP', retailers: [
    { name: 'ReadHub', price: 13999 },
    { name: 'UrbanKart', price: 13499 },
    { name: 'ElectroMart', price: 14299 },
    { name: 'MegaStore', price: 13799 }
  ]}
];

const BANKS = [
  { id: 'bank1', name: 'HDFC Bank', type: 'Savings', color: '#004C8F' },
  { id: 'bank2', name: 'ICICI Bank', type: 'Savings', color: '#AE275F' },
  { id: 'bank3', name: 'State Bank of India', type: 'Savings', color: '#0072CE' },
  { id: 'bank4', name: 'Axis Bank', type: 'Current', color: '#97144D' },
  { id: 'bank5', name: 'Kotak Mahindra Bank', type: 'Savings', color: '#ED1C24' },
  { id: 'bank6', name: 'Yes Bank', type: 'Current', color: '#1A1A1A' },
  { id: 'bank7', name: 'Punjab National Bank', type: 'Savings', color: '#F7A600' },
  { id: 'bank8', name: 'Paytm Payments Bank', type: 'Wallet', color: '#00BAF2' },
  { id: 'bank9', name: 'Airtel Payments Bank', type: 'Wallet', color: '#E40000' },
  { id: 'bank10', name: 'IndusInd Bank', type: 'Current', color: '#1E4E79' }
];

const STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', color: '#e11d48' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', color: '#2563eb' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', color: '#7c3aed' },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', color: '#0d9488' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', color: '#f59e0b' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', color: '#10b981' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', color: '#06b6d4' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', color: '#8b5cf6' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', color: '#f43f5e' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', color: '#6366f1' }
];

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Health', 'Travel', 'Education', 'Other'];
const CATEGORY_COLORS = {
  'Food': '#f97316',
  'Transport': '#3b82f6',
  'Shopping': '#8b5cf6',
  'Bills & Utilities': '#06b6d4',
  'Entertainment': '#ec4899',
  'Health': '#10b981',
  'Travel': '#eab308',
  'Education': '#6366f1',
  'Other': '#64748b'
};

const PRODUCT_CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Books'];

function seededRng(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function candleData(symbol, days = 90) {
  const rng = seededRng(symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + days);
  const base = 800 + rng() * 4200;
  const data = [];
  let prevClose = base;
  for (let i = days; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const drift = (rng() - 0.48) * 0.045;
    const open = prevClose;
    const close = open * (1 + drift);
    const high = Math.max(open, close) * (1 + rng() * 0.03);
    const low = Math.min(open, close) * (1 - rng() * 0.03);
    data.push({ date: date.toISOString().slice(0, 10), open, high, low, close, volume: Math.floor(50000 + rng() * 450000) });
    prevClose = close;
  }
  return data;
}

function marketSnapshot() {
  return STOCKS.map((s) => {
    const rng = seededRng(s.symbol.length * 7919);
    const price = 400 + rng() * 3800;
    const change = (rng() - 0.45) * 6;
    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      color: s.color,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePct: Math.round((change / (price - change) * 100) * 100) / 100
    };
  });
}

function lineSeries(days, base, volatility, seed) {
  const rng = seededRng(seed);
  const out = [];
  let v = base;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    v = v * (1 + (rng() - 0.5) * volatility);
    out.push({ date: date.toISOString().slice(0, 10), value: Math.round(v * 100) / 100 });
  }
  return out;
}

module.exports = {
  PRODUCTS,
  BANKS,
  STOCKS,
  CATEGORIES,
  CATEGORY_COLORS,
  PRODUCT_CATEGORIES,
  candleData,
  marketSnapshot,
  lineSeries
};
