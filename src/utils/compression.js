import { toGray } from "./engine";

//  COMPRESSION ANALYSIS
// ═══════════════════════════════════════════════
export function rleAnalysis(id) {
  const { data } = id;
  const grays = [];
  for (let i = 0; i < data.length; i += 4) grays.push(Math.round(toGray(data[i], data[i + 1], data[i + 2])));
  const enc = []; let count = 1;
  for (let i = 1; i < grays.length; i++) {
    if (grays[i] === grays[i - 1]) count++;
    else { enc.push([count, grays[i - 1]]); count = 1; }
  }
  enc.push([count, grays[grays.length - 1]]);
  const orig = grays.length, comp = enc.length * 2;
  return { name: 'Run-Length Encoding (RLE)', algo: 'Replaces consecutive identical pixel values with (count, value) pairs', originalBytes: orig, compressedBytes: comp, ratio: (comp / orig * 100).toFixed(1), detail: `${enc.length} runs from ${orig} pixels`, stats: [{ k: 'Total Pixels', v: orig.toLocaleString() }, { k: 'Total Runs', v: enc.length.toLocaleString() }, { k: 'Avg Run Length', v: (orig / enc.length).toFixed(2) }, { k: 'Bytes Saved', v: Math.max(0, orig - comp).toLocaleString() }] };
}

export function huffmanAnalysis(id) {
  const { data } = id;
  const freq = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) freq[Math.round(toGray(data[i], data[i + 1], data[i + 2]))]++;
  let pq = freq.map((f, v) => ({ val: v, freq: f })).filter(n => n.freq > 0).sort((a, b) => a.freq - b.freq);
  while (pq.length > 1) {
    const a = pq.shift(), b = pq.shift();
    const node = { freq: a.freq + b.freq, left: a, right: b };
    const pos = pq.findIndex(n => n.freq > node.freq);
    pos === -1 ? pq.push(node) : pq.splice(pos, 0, node);
  }
  const codes = {};
  const traverse = (node, code) => {
    if (node.val !== undefined) { codes[node.val] = code || '0'; return; }
    if (node.left) traverse(node.left, code + '0');
    if (node.right) traverse(node.right, code + '1');
  };
  if (pq[0]) traverse(pq[0], '');
  let bits = 0;
  for (let i = 0; i < data.length; i += 4) bits += (codes[Math.round(toGray(data[i], data[i + 1], data[i + 2]))] || '').length;
  const n = data.length / 4;
  const orig = n, comp = Math.ceil(bits / 8);
  const avgBits = (bits / n).toFixed(2);
  return { name: 'Huffman Coding', algo: 'Variable-length prefix codes assigned based on symbol frequency', originalBytes: orig, compressedBytes: comp, ratio: (comp / orig * 100).toFixed(1), detail: `${avgBits} bits/pixel avg, ${Object.keys(codes).length} unique symbols`, stats: [{ k: 'Unique Symbols', v: Object.keys(codes).length }, { k: 'Avg Bits/Pixel', v: avgBits }, { k: 'Total Bits', v: bits.toLocaleString() }, { k: 'Compression Ratio', v: (orig / comp).toFixed(2) + ':1' }] };
}

export function lzwAnalysis(id) {
  const { data } = id;
  const grays = [];
  for (let i = 0; i < data.length; i += 4) grays.push(Math.round(toGray(data[i], data[i + 1], data[i + 2])));
  const limit = Math.min(grays.length, 8000);
  const dict = {}; for (let i = 0; i < 256; i++) dict[String(i)] = i;
  let dictSize = 256, w = String(grays[0]);
  const enc = [];
  for (let i = 1; i < limit; i++) {
    const wc = w + ',' + grays[i];
    if (dict[wc] !== undefined) w = wc;
    else { enc.push(dict[w]); dict[wc] = dictSize++; w = String(grays[i]); }
  }
  enc.push(dict[w]);
  const orig = limit, comp = enc.length;
  return { name: 'Lempel-Ziv-Welch (LZW)', algo: 'Dictionary-based compression, builds codebook dynamically from repeated patterns', originalBytes: orig, compressedBytes: comp, ratio: (comp / orig * 100).toFixed(1), detail: `Dict grew to ${dictSize} entries (sampled ${limit} px)`, stats: [{ k: 'Sample Size', v: limit.toLocaleString() }, { k: 'Dict Entries', v: dictSize.toLocaleString() }, { k: 'Encoded Codes', v: enc.length.toLocaleString() }, { k: 'Savings', v: (100 - comp / orig * 100).toFixed(1) + '%' }] };
}

// ═══════════════════════════════════════════════
