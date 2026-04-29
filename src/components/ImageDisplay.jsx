"use client";

export default function ImageDisplay({ 
  imgData, 
  dragging, 
  setDragging, 
  loadFile, 
  fileRef, 
  origRef, 
  procRef, 
  handleCanvasClick, 
  selected, 
  seedPoint, 
  processing, 
  compStats, 
  catColor 
}) {
  return (
    <div style={{ flex: 1, display: 'flex', gap: 12, padding: 12, overflow: 'auto', alignItems: 'flex-start', background: '#060810' }}>
      {/* Original */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: '#35405a', letterSpacing: '0.12em', marginBottom: 6 }}>ORIGINAL</div>
        {!imgData ? (
          <div
            className={`drop-zone${dragging ? ' drag' : ''}`}
            style={{ minHeight: 320 }}
            onDrop={e => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current.click()}
          >
            <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 14, color: '#00d4ff' }}>⬡</div>
            <div style={{ fontSize: 11, color: '#35405a', letterSpacing: '0.1em' }}>DROP IMAGE HERE</div>
            <div style={{ fontSize: 9, color: '#1e2236', marginTop: 6 }}>JPG · PNG · GIF · WebP</div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <canvas ref={origRef} onClick={handleCanvasClick}
              style={{ width: '100%', maxHeight: 480, objectFit: 'contain', display: 'block', borderRadius: 5, border: '1px solid #12152a', cursor: selected?.id === 'region_grow' ? 'crosshair' : 'default' }} />
            {selected?.id === 'region_grow' && (
              <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(52,211,153,0.12)', border: '1px solid #34d399', borderRadius: 3, padding: '2px 8px', fontSize: 9, color: '#34d399' }}>
                {seedPoint ? `SEED (${Math.round(seedPoint.x)}, ${Math.round(seedPoint.y)})` : 'CLICK TO SET SEED'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: '#35405a', letterSpacing: '0.12em', marginBottom: 6 }}>OUTPUT</div>

        {compStats ? (
          <div style={{ background: '#090a14', border: '1px solid #12152a', borderRadius: 8, padding: 18 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: '#34d399', marginBottom: 4, fontWeight: 500 }}>{compStats.name}</div>
            <div style={{ fontSize: 9, color: '#35405a', marginBottom: 16 }}>{compStats.algo}</div>

            <div className="stat-grid" style={{ marginBottom: 14 }}>
              {compStats.stats.map(s => (
                <div key={s.k} className="stat-card">
                  <div style={{ fontSize: 9, color: '#35405a', marginBottom: 3 }}>{s.k}</div>
                  <div style={{ fontSize: 15, color: '#34d399', fontWeight: 500 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#35405a', marginBottom: 5 }}>
                <span>Compressed size vs. original</span>
                <span style={{ color: '#34d399' }}>{compStats.ratio}%</span>
              </div>
              <div style={{ height: 6, background: '#12152a', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, parseFloat(compStats.ratio))}%`, background: 'linear-gradient(90deg,#34d399,#22c55e)', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 8, color: '#22253a' }}>0%</span>
                <span style={{ fontSize: 8, color: '#22253a' }}>100% (no compression)</span>
              </div>
            </div>

            <div style={{ background: '#0c0e1a', borderRadius: 4, padding: '8px 12px', fontSize: 9, color: '#6870a0', borderLeft: '2px solid #34d399' }}>
              {compStats.detail}
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <canvas ref={procRef}
              style={{ width: '100%', maxHeight: 480, objectFit: 'contain', display: 'block', borderRadius: 5, border: '1px solid #12152a', background: '#090a14', minHeight: 200 }} />
            {!imgData && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e2236', fontSize: 10, letterSpacing: '0.12em' }}>
                NO OUTPUT YET
              </div>
            )}
            {processing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,8,16,0.7)', borderRadius: 5, fontSize: 10, color: catColor, letterSpacing: '0.1em' }}>
                PROCESSING...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
