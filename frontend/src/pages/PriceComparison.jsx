import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { PRODUCT_CATEGORIES, formatINR } from '../utils';

export default function PriceComparison() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { toast } = useToast();

  const load = useCallback((cat) => {
    api.get(`/products?category=${encodeURIComponent(cat)}`)
      .then((d) => setProducts(d.products))
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => {
    load(category);
  }, [category, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const bestPrice = (product) => Math.min(...product.retailers.map((r) => r.price));
  const worstPrice = (product) => Math.max(...product.retailers.map((r) => r.price));
  const savings = (product) => worstPrice(product) - bestPrice(product);

  const selected = products.find((p) => p.id === selectedId);

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <h1>Price comparison</h1>
          <p className="muted">Mock products and prices across retailers.</p>
        </div>
      </div>

      <div className="price-controls">
        <div className="seg">
          {PRODUCT_CATEGORIES.map((c) => (
            <button key={c} type="button" className={`seg-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
        />
      </div>

      {selected && (
        <div className="card price-detail">
          <div className="card-head">
            <h3>{selected.name}</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedId(null)}>Close</button>
          </div>
          <p className="muted">
            Best price {formatINR(bestPrice(selected))} · You can save up to {formatINR(savings(selected))}
          </p>
          <div className="retailer-list">
            {selected.retailers
              .slice()
              .sort((a, b) => a.price - b.price)
              .map((r, i) => (
                <div key={r.name} className={`retailer-row ${i === 0 ? 'best' : ''}`}>
                  <span className="retailer-rank">{i === 0 ? 'Best' : `#${i + 1}`}</span>
                  <strong>{r.name}</strong>
                  <span className="retailer-price">{formatINR(r.price)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="product-grid">
        {filtered.map((p) => (
          <button key={p.id} type="button" className="product-card" onClick={() => setSelectedId(p.id)}>
            <div className="product-tag">{p.tag}</div>
            <div className="product-body">
              <strong>{p.name}</strong>
              <span className="muted tiny">{p.category}</span>
            </div>
            <div className="product-bottom">
              <span className="product-best">from {formatINR(bestPrice(p))}</span>
              <span className="product-save muted tiny">save {formatINR(savings(p))}</span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state full">
            <p className="muted">No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
