import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BulkOrderPage({ products, onAddToCart }) {
  const navigate = useNavigate();
  const [csvText, setCsvText] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleParse = () => {
    setError('');
    setResults([]);
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) { setError('CSV must have a header row and at least one data row.'); return; }
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = header.indexOf('product_name');
    const idIdx = header.indexOf('product_id');
    const qtyIdx = header.indexOf('quantity');
    if ((nameIdx === -1 && idIdx === -1) || qtyIdx === -1) {
      setError('CSV must have "product_name" (or "product_id") and "quantity" columns.');
      return;
    }
    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const qty = parseInt(cols[qtyIdx]) || 0;
      if (qty <= 0) continue;
      let match = null;
      if (idIdx !== -1) {
        match = products.find(p => String(p.id) === cols[idIdx]);
      }
      if (!match && nameIdx !== -1) {
        match = products.find(p => p.name.toLowerCase() === cols[nameIdx].toLowerCase());
      }
      if (!match) {
        match = products.find(p => p.name.toLowerCase().includes(cols[nameIdx]?.toLowerCase() || ''));
      }
      parsed.push({ product: match, requestedName: cols[nameIdx] || cols[idIdx] || '', quantity: qty, found: !!match });
    }
    setResults(parsed);
  };

  const handleAddAll = () => {
    results.forEach(r => {
      if (r.product) onAddToCart(r.product, r.quantity);
    });
    navigate('/cart');
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Bulk Order Upload</h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>Upload a CSV file or paste CSV data to quickly add multiple products to your cart.</p>

      <div className="summary-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          CSV format: <code>product_name,quantity</code> or <code>product_id,quantity</code>
        </div>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={`product_name,quantity\nAmul Butter,20\nCoca-Cola 750ml,30`}
          rows={8}
          style={{ width: '100%', padding: '12px', fontSize: '13px', fontFamily: 'monospace', borderRadius: '6px', border: '1px solid var(--color-border)', resize: 'vertical' }}
        />
        <button className="primary-b2b-btn" onClick={handleParse} style={{ marginTop: '12px' }}>Parse CSV</button>
        {error && <p style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, marginTop: '12px' }}>{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="summary-card" style={{ padding: '24px', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px' }}>Parsed Items ({results.filter(r => r.found).length} matched / {results.filter(r => !r.found).length} not found)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: r.found ? '#f0fdf4' : '#fef2f2', borderRadius: '4px', fontSize: '13px', border: '1px solid', borderColor: r.found ? '#bbf7d0' : '#fecaca' }}>
                <span>
                  {r.product ? <strong>{r.product.name}</strong> : <span style={{ color: '#dc2626' }}>{r.requestedName} — not found</span>}
                  {r.product && <> × {r.quantity}</>}
                </span>
                {r.found && <span style={{ color: '#16a34a', fontWeight: 600 }}>Matched ✓</span>}
              </div>
            ))}
          </div>
          {results.some(r => r.found) && (
            <button className="primary-b2b-btn" onClick={handleAddAll} style={{ marginTop: '16px' }}>
              Add {results.filter(r => r.found).length} Items to Cart
            </button>
          )}
        </div>
      )}
    </div>
  );
}
