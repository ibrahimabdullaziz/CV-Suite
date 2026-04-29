"use client";

export default function Toolbar({ 
  imgDims, 
  selected, 
  catColor, 
  elapsed, 
  processing, 
  applyOp, 
  downloadResult, 
  fileRef, 
  loadFile, 
  imgData 
}) {
  return (
    <div style={{ height: 46, background: '#090a14', borderBottom: '1px solid #12152a', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flexShrink: 0 }}>
      <button className="upload-btn" onClick={() => fileRef.current.click()}>UPLOAD</button>
      <input 
        ref={fileRef} 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        onChange={e => { if (e.target.files[0]) loadFile(e.target.files[0]); e.target.value = ''; }} 
      />

      {imgDims && <div style={{ fontSize: 9, color: '#35405a', paddingLeft: 4 }}>{imgDims.w}×{imgDims.h}</div>}

      <div style={{ flex: 1 }} />

      {selected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: '#0c0e1a', borderRadius: 3, border: '1px solid #16192a' }}>
          <span style={{ fontSize: 9, color: '#35405a' }}>OP</span>
          <span style={{ fontSize: 10, color: catColor }}>{selected.label}</span>
        </div>
      )}

      {elapsed && <div style={{ fontSize: 9, color: '#39d98a', padding: '0 4px' }}>{elapsed}ms</div>}

      <button className="apply-btn" style={{ '--ac': catColor }} onClick={applyOp} disabled={!imgData || !selected || processing}>
        {processing ? '◌ RUNNING' : '▶ APPLY'}
      </button>

      <button className="upload-btn" onClick={downloadResult} disabled={!imgData}>SAVE PNG</button>
    </div>
  );
}
