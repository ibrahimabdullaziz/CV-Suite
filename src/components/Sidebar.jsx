"use client";
import { MENU } from "@/constants/menu";

export default function Sidebar({ 
  selected, 
  selectOp, 
  expandedCats, 
  toggleCat, 
  expandedSubs, 
  toggleSub, 
  status 
}) {
  return (
    <div style={{ width: 230, background: '#090a14', borderRight: '1px solid #12152a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid #12152a' }}>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: '#00d4ff', letterSpacing: '0.05em' }}>CV Suite</div>
        <div style={{ fontSize: 9, color: '#2a3050', letterSpacing: '0.18em', marginTop: 2 }}>IMAGE PROCESSING LAB</div>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {MENU.map(cat => {
          const ac = cat.color;
          const isExpanded = expandedCats[cat.id];
          return (
            <div key={cat.id} style={{ '--ac': ac }}>
              <div className="cat-hdr" style={{ '--ac': ac }} onClick={() => toggleCat(cat.id)}>
                <span style={{ color: ac, fontSize: 11 }}>{cat.icon}</span>
                <span style={{ flex: 1 }}>{cat.label}</span>
                <span style={{ fontSize: 7, transform: isExpanded ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}>▶</span>
              </div>
              {isExpanded && cat.subs.map(sub => {
                const subKey = cat.id + sub.label;
                const isSubExpanded = expandedSubs[subKey] !== false;
                return (
                  <div key={sub.label}>
                    <div className="sub-hdr" onClick={() => toggleSub(subKey)}>
                      <span>{sub.label}</span>
                      <span style={{ fontSize: 7 }}>{isSubExpanded ? '▾' : '▸'}</span>
                    </div>
                    {isSubExpanded && sub.items.map(item => (
                      <div
                        key={item.id}
                        className={`mitem${selected?.id === item.id ? ' active' : ''}`}
                        style={{ 
                          '--ac': ac, 
                          '--acr': ac === '#00d4ff' ? '0,212,255' : ac === '#a78bfa' ? '167,139,250' : ac === '#34d399' ? '52,211,153' : '245,158,11' 
                        }}
                        onClick={() => selectOp(item)}
                      >
                        {item.label}
                        {item.note && <div style={{ fontSize: 8, color: '#404870', marginTop: 1 }}>{item.note}</div>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #12152a', fontSize: 9, color: '#35405a', lineHeight: 1.5 }}>
        {status}
      </div>
    </div>
  );
}
