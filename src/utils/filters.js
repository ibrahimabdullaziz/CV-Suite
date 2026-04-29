import { clamp, convolve, gaussKernel } from "./engine";

//  FILTERS — LINEAR
// ═══════════════════════════════════════════════
export function meanFilter(id, size = 3) {
  return convolve(id, new Array(size * size).fill(1), size);
}

export function gaussianFilter(id, size = 5, sigma = 1.4) {
  const k = gaussKernel(size, sigma);
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - half));
          const py = Math.min(height - 1, Math.max(0, y + ky - half));
          const w = k[ky * size + kx];
          const i = (py * width + px) * 4;
          r += data[i] * w; g += data[i + 1] * w; b += data[i + 2] * w;
        }
      }
      const i = (y * width + x) * 4;
      out[i] = clamp(r); out[i + 1] = clamp(g); out[i + 2] = clamp(b); out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export function midpointFilter(id, size = 3) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = [], g = [], b = [];
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]);
        }
      }
      const i = (y * width + x) * 4;
      out[i] = (Math.min(...r) + Math.max(...r)) / 2;
      out[i + 1] = (Math.min(...g) + Math.max(...g)) / 2;
      out[i + 2] = (Math.min(...b) + Math.max(...b)) / 2;
      out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export function alphaTrimmedFilter(id, size = 3, d = 2) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  const avg = (arr, t) => {
    const s = arr.slice(t, arr.length - t);
    return s.reduce((a, v) => a + v, 0) / (s.length || 1);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = [], g = [], b = [];
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]);
        }
      }
      r.sort((a, b) => a - b); g.sort((a, b) => a - b); b.sort((a, b) => a - b);
      const t = Math.floor(d / 2);
      const i = (y * width + x) * 4;
      out[i] = clamp(avg(r, t)); out[i + 1] = clamp(avg(g, t)); out[i + 2] = clamp(avg(b, t)); out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export function harmonicFilter(id, size = 3) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  const n = size * size;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rs = 0, gs = 0, bs = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          rs += 1 / (data[i] || 1); gs += 1 / (data[i + 1] || 1); bs += 1 / (data[i + 2] || 1);
        }
      }
      const i = (y * width + x) * 4;
      out[i] = clamp(n / rs); out[i + 1] = clamp(n / gs); out[i + 2] = clamp(n / bs); out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export function lowPassFilter(id) { return gaussianFilter(id, 9, 2.5); }

export function highPassFilter(id) {
  const { width, height, data } = id;
  const lp = gaussianFilter(id, 5, 1.0);
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = clamp(128 + data[i] - lp.data[i]);
    out[i + 1] = clamp(128 + data[i + 1] - lp.data[i + 1]);
    out[i + 2] = clamp(128 + data[i + 2] - lp.data[i + 2]);
    out[i + 3] = 255;
  }
  return new ImageData(out, width, height);
}

// ═══════════════════════════════════════════════

//  FILTERS — NON-LINEAR
// ═══════════════════════════════════════════════
export function medianFilter(id, size = 3) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = [], g = [], b = [];
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]);
        }
      }
      r.sort((a, b) => a - b); g.sort((a, b) => a - b); b.sort((a, b) => a - b);
      const mid = Math.floor(r.length / 2);
      const i = (y * width + x) * 4;
      out[i] = r[mid]; out[i + 1] = g[mid]; out[i + 2] = b[mid]; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export function modeFilter(id, size = 3) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  const findMode = arr => {
    const freq = {};
    arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
    return +Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = [], g = [], b = [];
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]);
        }
      }
      const i = (y * width + x) * 4;
      out[i] = findMode(r); out[i + 1] = findMode(g); out[i + 2] = findMode(b); out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export function maxFilter(id, size = 3) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rm = 0, gm = 0, bm = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          rm = Math.max(rm, data[i]); gm = Math.max(gm, data[i + 1]); bm = Math.max(bm, data[i + 2]);
        }
      }
      const i = (y * width + x) * 4;
      out[i] = rm; out[i + 1] = gm; out[i + 2] = bm; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export function minFilter(id, size = 3) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rm = 255, gm = 255, bm = 255;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          rm = Math.min(rm, data[i]); gm = Math.min(gm, data[i + 1]); bm = Math.min(bm, data[i + 2]);
        }
      }
      const i = (y * width + x) * 4;
      out[i] = rm; out[i + 1] = gm; out[i + 2] = bm; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

// ═══════════════════════════════════════════════
