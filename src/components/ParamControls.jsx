"use client";

export default function ParamControls({ selected, params, setParams, catColor }) {
  if (!selected || selected.params.length === 0) return null;

  return (
    <div style={{ background: '#090a14', borderTop: '1px solid #12152a', padding: '10px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
      {selected.params.map(p => (
        <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
          <div style={{ fontSize: 9, color: '#55608a', minWidth: 80, whiteSpace: 'nowrap' }}>{p.label}</div>
          <input
            type="range" min={p.min} max={p.max} step={p.step}
            value={params[p.key] ?? p.def}
            onChange={e => setParams(ps => ({ ...ps, [p.key]: parseFloat(e.target.value) }))}
            style={{ flex: 1, '--ac': catColor }}
          />
          <div style={{ fontSize: 11, color: catColor, minWidth: 36, textAlign: 'right', fontWeight: 500 }}>
            {params[p.key] ?? p.def}
          </div>
        </div>
      ))}
    </div>
  );
}
