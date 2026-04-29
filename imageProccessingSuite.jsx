import { useState, useRef, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════
const clamp = (v, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, Math.round(v)));
const toGray = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// ═══════════════════════════════════════════════
//  CONVOLUTION ENGINE
// ═══════════════════════════════════════════════
function convolve(imgData, kernel, kSize) {
  const { width, height, data } = imgData;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(kSize / 2);
  const kSum = kernel.reduce((a, b) => a + b, 0) || 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - half));
          const py = Math.min(height - 1, Math.max(0, y + ky - half));
          const w = kernel[ky * kSize + kx];
          const i = (py * width + px) * 4;
          r += data[i] * w; g += data[i + 1] * w; b += data[i + 2] * w;
        }
      }
      const i = (y * width + x) * 4;
      out[i] = clamp(r / kSum); out[i + 1] = clamp(g / kSum); out[i + 2] = clamp(b / kSum); out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

function gaussKernel(size, sigma) {
  const half = Math.floor(size / 2);
  const k = [];
  let sum = 0;
  for (let y = -half; y <= half; y++) {
    for (let x = -half; x <= half; x++) {
      const v = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      k.push(v); sum += v;
    }
  }
  return k.map(v => v / sum);
}

// ═══════════════════════════════════════════════
//  FILTERS — LINEAR
// ═══════════════════════════════════════════════
function meanFilter(id, size = 3) {
  return convolve(id, new Array(size * size).fill(1), size);
}

function gaussianFilter(id, size = 5, sigma = 1.4) {
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

function midpointFilter(id, size = 3) {
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

function alphaTrimmedFilter(id, size = 3, d = 2) {
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

function harmonicFilter(id, size = 3) {
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

function lowPassFilter(id) { return gaussianFilter(id, 9, 2.5); }

function highPassFilter(id) {
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
function medianFilter(id, size = 3) {
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

function modeFilter(id, size = 3) {
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

function maxFilter(id, size = 3) {
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

function minFilter(id, size = 3) {
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
//  EDGE DETECTION
// ═══════════════════════════════════════════════
function sobelFilter(id) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const Kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const Ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * width + (x + kx)) * 4;
          const gr = toGray(data[i], data[i + 1], data[i + 2]);
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += gr * Kx[ki]; gy += gr * Ky[ki];
        }
      }
      const mag = clamp(Math.sqrt(gx * gx + gy * gy));
      const i = (y * width + x) * 4;
      out[i] = mag; out[i + 1] = mag; out[i + 2] = mag; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

function prewittFilter(id) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const Kx = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
  const Ky = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * width + (x + kx)) * 4;
          const gr = toGray(data[i], data[i + 1], data[i + 2]);
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += gr * Kx[ki]; gy += gr * Ky[ki];
        }
      }
      const mag = clamp(Math.sqrt(gx * gx + gy * gy));
      const i = (y * width + x) * 4;
      out[i] = mag; out[i + 1] = mag; out[i + 2] = mag; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

function laplacianFilter(id) {
  const { width, height, data } = id;
  const out = new Uint8ClampedArray(data.length);
  const K = [0, 1, 0, 1, -4, 1, 0, 1, 0];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * width + (x + kx)) * 4;
          sum += toGray(data[i], data[i + 1], data[i + 2]) * K[(ky + 1) * 3 + (kx + 1)];
        }
      }
      const val = clamp(Math.abs(sum));
      const i = (y * width + x) * 4;
      out[i] = val; out[i + 1] = val; out[i + 2] = val; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

function cannyFilter(id, lo = 50, hi = 150) {
  const { width, height, data } = id;
  const blurred = gaussianFilter(id, 5, 1.4);
  const mags = new Float32Array(width * height);
  const angs = new Float32Array(width * height);
  const Kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const Ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * width + (x + kx)) * 4;
          const gr = toGray(blurred.data[i], blurred.data[i + 1], blurred.data[i + 2]);
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += gr * Kx[ki]; gy += gr * Ky[ki];
        }
      }
      mags[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      angs[y * width + x] = Math.atan2(gy, gx) * 180 / Math.PI;
    }
  }
  const supp = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const ang = ((angs[y * width + x] % 180) + 180) % 180;
      const mag = mags[y * width + x];
      let n1 = 0, n2 = 0;
      if ((ang >= 0 && ang < 22.5) || ang >= 157.5) { n1 = mags[y * width + x - 1]; n2 = mags[y * width + x + 1]; }
      else if (ang >= 22.5 && ang < 67.5) { n1 = mags[(y - 1) * width + x + 1]; n2 = mags[(y + 1) * width + x - 1]; }
      else if (ang >= 67.5 && ang < 112.5) { n1 = mags[(y - 1) * width + x]; n2 = mags[(y + 1) * width + x]; }
      else { n1 = mags[(y - 1) * width + x - 1]; n2 = mags[(y + 1) * width + x + 1]; }
      supp[y * width + x] = (mag >= n1 && mag >= n2) ? mag : 0;
    }
  }
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const mag = supp[y * width + x];
      const i = (y * width + x) * 4;
      const val = mag >= hi ? 255 : mag >= lo ? 160 : 0;
      out[i] = val; out[i + 1] = val; out[i + 2] = val; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

// ═══════════════════════════════════════════════
//  SEGMENTATION
// ═══════════════════════════════════════════════
function otsuSegment(id) {
  const { width, height, data } = id;
  const hist = new Array(256).fill(0);
  const n = width * height;
  for (let i = 0; i < data.length; i += 4) hist[Math.round(toGray(data[i], data[i + 1], data[i + 2]))]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, maxVar = 0, thresh = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue;
    const wF = n - wB; if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) ** 2;
    if (v > maxVar) { maxVar = v; thresh = t; }
  }
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const val = toGray(data[i], data[i + 1], data[i + 2]) > thresh ? 255 : 0;
    out[i] = val; out[i + 1] = val; out[i + 2] = val; out[i + 3] = 255;
  }
  return new ImageData(out, width, height);
}

function adaptiveSegment(id, blockSize = 15, C = 5) {
  const { width, height, data } = id;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) gray[i / 4] = toGray(data[i], data[i + 1], data[i + 2]);
  const out = new Uint8ClampedArray(data.length);
  const half = Math.floor(blockSize / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let s = 0, cnt = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          s += gray[Math.min(height - 1, Math.max(0, y + ky)) * width + Math.min(width - 1, Math.max(0, x + kx))];
          cnt++;
        }
      }
      const val = gray[y * width + x] > (s / cnt - C) ? 255 : 0;
      const i = (y * width + x) * 4;
      out[i] = val; out[i + 1] = val; out[i + 2] = val; out[i + 3] = 255;
    }
  }
  return new ImageData(out, width, height);
}

function regionGrowing(id, seedX, seedY, thresh = 30) {
  const { width, height, data } = id;
  const visited = new Uint8Array(width * height);
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < out.length; i += 4) { out[i] = 18; out[i + 1] = 18; out[i + 2] = 28; out[i + 3] = 255; }
  const si = (seedY * width + seedX) * 4;
  const seedG = toGray(data[si], data[si + 1], data[si + 2]);
  const queue = [[seedX, seedY]];
  visited[seedY * width + seedX] = 1;
  while (queue.length) {
    const [cx, cy] = queue.shift();
    const i = (cy * width + cx) * 4;
    out[i] = 0; out[i + 1] = 210; out[i + 2] = 100; out[i + 3] = 255;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height || visited[ny * width + nx]) continue;
      const ni = (ny * width + nx) * 4;
      if (Math.abs(toGray(data[ni], data[ni + 1], data[ni + 2]) - seedG) <= thresh) {
        visited[ny * width + nx] = 1;
        queue.push([nx, ny]);
      }
    }
  }
  return new ImageData(out, width, height);
}

function kMeansSegment(id, k = 4) {
  const { width, height, data } = id;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) pixels.push([data[i], data[i + 1], data[i + 2]]);
  let centroids = [];
  const step = Math.max(1, Math.floor(pixels.length / k));
  for (let i = 0; i < k; i++) centroids.push([...pixels[i * step]]);
  let labels = new Array(pixels.length).fill(0);
  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let minD = Infinity, best = 0;
      for (let j = 0; j < k; j++) {
        const d = (pixels[i][0] - centroids[j][0]) ** 2 + (pixels[i][1] - centroids[j][1]) ** 2 + (pixels[i][2] - centroids[j][2]) ** 2;
        if (d < minD) { minD = d; best = j; }
      }
      labels[i] = best;
    }
    const nc = Array.from({ length: k }, () => [0, 0, 0, 0]);
    labels.forEach((l, i) => { nc[l][0] += pixels[i][0]; nc[l][1] += pixels[i][1]; nc[l][2] += pixels[i][2]; nc[l][3]++; });
    centroids = nc.map((c, i) => c[3] > 0 ? [c[0] / c[3], c[1] / c[3], c[2] / c[3]] : centroids[i]);
  }
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < pixels.length; i++) {
    const c = centroids[labels[i]];
    out[i * 4] = clamp(c[0]); out[i * 4 + 1] = clamp(c[1]); out[i * 4 + 2] = clamp(c[2]); out[i * 4 + 3] = 255;
  }
  return new ImageData(out, width, height);
}

function watershedSegment(id) {
  const sob = sobelFilter(id);
  const { width, height } = id;
  const palette = [[220, 50, 50], [50, 200, 80], [60, 100, 240], [240, 200, 40], [200, 60, 200], [40, 210, 210], [240, 130, 40], [130, 230, 50]];
  const out = new Uint8ClampedArray(sob.data.length);
  for (let i = 0; i < sob.data.length; i += 4) {
    const lvl = Math.min(7, Math.floor(sob.data[i] / 32));
    const c = palette[lvl];
    out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255;
  }
  return new ImageData(out, width, height);
}

// ═══════════════════════════════════════════════
//  PADDING
// ═══════════════════════════════════════════════
function padImage(id, padSize, mode) {
  const { width, height, data } = id;
  const nw = width + padSize * 2, nh = height + padSize * 2;
  const out = new Uint8ClampedArray(nw * nh * 4);
  const get = (x, y) => {
    if (mode === 'zero' && (x < 0 || x >= width || y < 0 || y >= height)) return [0, 0, 0, 255];
    let sx = x, sy = y;
    if (mode === 'replicate') {
      sx = Math.max(0, Math.min(width - 1, x)); sy = Math.max(0, Math.min(height - 1, y));
    } else if (mode === 'reflect') {
      if (sx < 0) sx = -sx - 1; if (sx >= width) sx = 2 * width - sx - 1;
      if (sy < 0) sy = -sy - 1; if (sy >= height) sy = 2 * height - sy - 1;
    } else if (mode === 'symmetric') {
      if (sx < 0) sx = -sx; if (sx >= width) sx = 2 * width - sx - 2;
      if (sy < 0) sy = -sy; if (sy >= height) sy = 2 * height - sy - 2;
    } else if (mode === 'wrap') {
      sx = ((x % width) + width) % width; sy = ((y % height) + height) % height;
    } else if (mode === 'asymmetric') {
      if (x < 0) return [255, 80, 80, 255];
      if (x >= width) return [80, 80, 255, 255];
      if (y < 0) return [255, 200, 80, 255];
      if (y >= height) return [80, 255, 160, 255];
      sx = x; sy = y;
    } else {
      sx = Math.max(0, Math.min(width - 1, x)); sy = Math.max(0, Math.min(height - 1, y));
    }
    sx = Math.max(0, Math.min(width - 1, sx)); sy = Math.max(0, Math.min(height - 1, sy));
    const i = (sy * width + sx) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const [r, g, b, a] = get(x - padSize, y - padSize);
      const i = (y * nw + x) * 4;
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
    }
  }
  return new ImageData(out, nw, nh);
}

// ═══════════════════════════════════════════════
//  COMPRESSION ANALYSIS
// ═══════════════════════════════════════════════
function rleAnalysis(id) {
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

function huffmanAnalysis(id) {
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

function lzwAnalysis(id) {
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
//  MENU STRUCTURE
// ═══════════════════════════════════════════════
const MENU = [
  {
    id: 'filters', label: 'FILTERS', icon: '⬡', color: '#00d4ff',
    subs: [
      {
        label: 'Linear', items: [
          { id: 'mean', label: 'Mean Filter', params: [{ key: 'size', label: 'Kernel Size', min: 3, max: 15, step: 2, def: 3 }] },
          { id: 'gaussian', label: 'Gaussian Filter', params: [{ key: 'size', label: 'Size', min: 3, max: 11, step: 2, def: 5 }, { key: 'sigma', label: 'Sigma', min: 0.3, max: 5.0, step: 0.1, def: 1.4 }] },
          { id: 'midpoint', label: 'Midpoint Filter', params: [{ key: 'size', label: 'Kernel Size', min: 3, max: 15, step: 2, def: 3 }] },
          { id: 'alpha_trimmed', label: 'Alpha-Trimmed', params: [{ key: 'size', label: 'Size', min: 3, max: 9, step: 2, def: 3 }, { key: 'd', label: 'd (trim)', min: 0, max: 4, step: 2, def: 2 }] },
          { id: 'harmonic', label: 'Harmonic Filter', params: [{ key: 'size', label: 'Kernel Size', min: 3, max: 9, step: 2, def: 3 }] },
          { id: 'lowpass', label: 'Low-Pass Filter', params: [] },
          { id: 'highpass', label: 'High-Pass Filter', params: [] },
        ]
      },
      {
        label: 'Non-Linear', items: [
          { id: 'median', label: 'Median Filter', params: [{ key: 'size', label: 'Kernel Size', min: 3, max: 11, step: 2, def: 3 }] },
          { id: 'mode', label: 'Mode Filter', params: [{ key: 'size', label: 'Kernel Size', min: 3, max: 7, step: 2, def: 3 }] },
          { id: 'max', label: 'Max Filter (Dilation)', params: [{ key: 'size', label: 'Kernel Size', min: 3, max: 11, step: 2, def: 3 }] },
          { id: 'min', label: 'Min Filter (Erosion)', params: [{ key: 'size', label: 'Kernel Size', min: 3, max: 11, step: 2, def: 3 }] },
        ]
      },
      {
        label: 'Edge Detection', items: [
          { id: 'sobel', label: 'Sobel', params: [] },
          { id: 'canny', label: 'Canny', params: [{ key: 'lo', label: 'Low Thresh', min: 10, max: 100, step: 5, def: 50 }, { key: 'hi', label: 'High Thresh', min: 50, max: 200, step: 10, def: 150 }] },
          { id: 'prewitt', label: 'Prewitt', params: [] },
          { id: 'laplacian', label: 'Laplacian (LoG)', params: [] },
        ]
      },
    ]
  },
  {
    id: 'segmentation', label: 'SEGMENTATION', icon: '⬢', color: '#a78bfa',
    subs: [
      {
        label: 'Thresholding', items: [
          { id: 'otsu', label: 'Otsu', params: [] },
          { id: 'adaptive', label: 'Adaptive', params: [{ key: 'blockSize', label: 'Block Size', min: 5, max: 51, step: 2, def: 15 }, { key: 'C', label: 'Constant C', min: -10, max: 20, step: 1, def: 5 }] },
        ]
      },
      {
        label: 'Edge-Based', items: [
          { id: 'edge_seg', label: 'Edge Segmentation', params: [] },
        ]
      },
      {
        label: 'Region-Based', items: [
          { id: 'region_grow', label: 'Region Growing', params: [{ key: 'thresh', label: 'Tolerance', min: 5, max: 80, step: 5, def: 30 }], note: '→ Click image to place seed' },
        ]
      },
      {
        label: 'Clustering', items: [
          { id: 'kmeans', label: 'K-Means', params: [{ key: 'k', label: 'K (clusters)', min: 2, max: 8, step: 1, def: 4 }] },
          { id: 'watershed', label: 'Watershed', params: [] },
        ]
      },
    ]
  },
  {
    id: 'compression', label: 'COMPRESSION', icon: '⬟', color: '#34d399',
    subs: [
      {
        label: 'Lossless Analysis', items: [
          { id: 'rle', label: 'RLE', params: [], isStats: true },
          { id: 'huffman', label: 'Huffman Coding', params: [], isStats: true },
          { id: 'lzw', label: 'LZW', params: [], isStats: true },
        ]
      }
    ]
  },
  {
    id: 'padding', label: 'PADDING', icon: '⬠', color: '#f59e0b',
    subs: [
      {
        label: 'Border Modes', items: [
          { id: 'pad_zero', label: 'Zero Padding', params: [{ key: 'size', label: 'Pad Width', min: 10, max: 100, step: 5, def: 30 }] },
          { id: 'pad_replicate', label: 'Replicate', params: [{ key: 'size', label: 'Pad Width', min: 10, max: 100, step: 5, def: 30 }] },
          { id: 'pad_reflect', label: 'Reflect', params: [{ key: 'size', label: 'Pad Width', min: 10, max: 100, step: 5, def: 30 }] },
          { id: 'pad_symmetric', label: 'Symmetric', params: [{ key: 'size', label: 'Pad Width', min: 10, max: 100, step: 5, def: 30 }] },
          { id: 'pad_wrap', label: 'Wrap (Circular)', params: [{ key: 'size', label: 'Pad Width', min: 10, max: 100, step: 5, def: 30 }] },
          { id: 'pad_asymmetric', label: 'Asymmetric', params: [{ key: 'size', label: 'Pad Width', min: 10, max: 100, step: 5, def: 30 }] },
        ]
      }
    ]
  },
];

// ═══════════════════════════════════════════════
//  HISTOGRAM COMPONENT
// ═══════════════════════════════════════════════
function Histogram({ imgData }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!imgData || !ref.current) return;
    const { data } = imgData;
    const hist = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) hist[Math.round(toGray(data[i], data[i + 1], data[i + 2]))]++;
    const max = Math.max(...hist);
    const canvas = ref.current;
    const cw = canvas.offsetWidth || 800, ch = 56;
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    for (let i = 0; i < 256; i++) {
      const barH = Math.round((hist[i] / max) * (ch - 4));
      const hue = 190 + i * 0.35;
      ctx.fillStyle = `hsla(${hue},90%,55%,0.85)`;
      ctx.fillRect(Math.round(i * cw / 256), ch - barH, Math.ceil(cw / 256) + 1, barH);
    }
  }, [imgData]);
  return <canvas ref={ref} style={{ width: '100%', height: 56, display: 'block' }} />;
}

// ═══════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function ImageProcessingSuite() {
  const [imgData, setImgData] = useState(null);
  const [imgDims, setImgDims] = useState(null);
  const [selected, setSelected] = useState(null);
  const [params, setParams] = useState({});
  const [compStats, setCompStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('Drop an image or click Upload to begin');
  const [elapsed, setElapsed] = useState(null);
  const [expandedCats, setExpandedCats] = useState({ filters: true, segmentation: false, compression: false, padding: false });
  const [expandedSubs, setExpandedSubs] = useState({});
  const [seedPoint, setSeedPoint] = useState(null);
  const [dragging, setDragging] = useState(false);

  const origRef = useRef(null);
  const procRef = useRef(null);
  const fileRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) { setStatus('Please upload a valid image file'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      const MAX = 640;
      if (w > MAX || h > MAX) { const s = Math.min(MAX / w, MAX / h); w = Math.round(w * s); h = Math.round(h * s); }
      const hc = hiddenCanvasRef.current;
      hc.width = w; hc.height = h;
      const ctx = hc.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const id = ctx.getImageData(0, 0, w, h);
      setImgData(id); setImgDims({ w, h });
      setCompStats(null); setSeedPoint(null); setElapsed(null); setSelected(null);
      const oc = origRef.current;
      oc.width = w; oc.height = h;
      oc.getContext('2d').putImageData(id, 0, 0);
      const pc = procRef.current;
      pc.width = w; pc.height = h;
      pc.getContext('2d').clearRect(0, 0, w, h);
      setStatus(`Loaded: ${file.name} · ${w}×${h}px · ${(file.size / 1024).toFixed(0)}KB`);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const selectOp = (item) => {
    setSelected(item); setSeedPoint(null); setCompStats(null); setElapsed(null);
    const defs = {};
    item.params.forEach(p => { defs[p.key] = p.def; });
    setParams(defs);
    setStatus(item.note ? `${item.label} — ${item.note}` : `Selected: ${item.label}`);
  };

  const applyOp = useCallback(async () => {
    if (!imgData || !selected || processing) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 16));
    const t0 = performance.now();
    try {
      const p = params;
      let result = null;

      // Strategy pattern dispatch
      switch (selected.id) {
        case 'mean':         result = meanFilter(imgData, p.size || 3); break;
        case 'gaussian':     result = gaussianFilter(imgData, p.size || 5, p.sigma || 1.4); break;
        case 'midpoint':     result = midpointFilter(imgData, p.size || 3); break;
        case 'alpha_trimmed':result = alphaTrimmedFilter(imgData, p.size || 3, p.d || 2); break;
        case 'harmonic':     result = harmonicFilter(imgData, p.size || 3); break;
        case 'lowpass':      result = lowPassFilter(imgData); break;
        case 'highpass':     result = highPassFilter(imgData); break;
        case 'median':       result = medianFilter(imgData, p.size || 3); break;
        case 'mode':         result = modeFilter(imgData, p.size || 3); break;
        case 'max':          result = maxFilter(imgData, p.size || 3); break;
        case 'min':          result = minFilter(imgData, p.size || 3); break;
        case 'sobel':        result = sobelFilter(imgData); break;
        case 'prewitt':      result = prewittFilter(imgData); break;
        case 'laplacian':    result = laplacianFilter(imgData); break;
        case 'canny':        result = cannyFilter(imgData, p.lo || 50, p.hi || 150); break;
        case 'otsu':         result = otsuSegment(imgData); break;
        case 'adaptive':     result = adaptiveSegment(imgData, p.blockSize || 15, p.C || 5); break;
        case 'edge_seg':     result = cannyFilter(imgData, 35, 90); break;
        case 'region_grow': {
          const sx = seedPoint ? Math.round(seedPoint.x) : Math.floor(imgData.width / 2);
          const sy = seedPoint ? Math.round(seedPoint.y) : Math.floor(imgData.height / 2);
          result = regionGrowing(imgData, sx, sy, p.thresh || 30); break;
        }
        case 'kmeans':       result = kMeansSegment(imgData, p.k || 4); break;
        case 'watershed':    result = watershedSegment(imgData); break;
        case 'rle':    { setCompStats(rleAnalysis(imgData)); setProcessing(false); return; }
        case 'huffman':{ setCompStats(huffmanAnalysis(imgData)); setProcessing(false); return; }
        case 'lzw':    { setCompStats(lzwAnalysis(imgData)); setProcessing(false); return; }
        default:
          if (selected.id.startsWith('pad_')) {
            const mode = selected.id.replace('pad_', '');
            result = padImage(imgData, p.size || 30, mode);
          }
      }

      if (result) {
        const pc = procRef.current;
        pc.width = result.width; pc.height = result.height;
        pc.getContext('2d').putImageData(result, 0, 0);
        const ms = (performance.now() - t0).toFixed(0);
        setElapsed(ms);
        setStatus(`✓ ${selected.label} applied in ${ms}ms`);
        setCompStats(null);
      }
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
    setProcessing(false);
  }, [imgData, selected, params, seedPoint, processing]);

  const handleCanvasClick = (e) => {
    if (selected?.id !== 'region_grow' || !imgData) return;
    const rect = origRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (imgData.width / rect.width);
    const sy = (e.clientY - rect.top) * (imgData.height / rect.height);
    setSeedPoint({ x: sx, y: sy });
    setStatus(`Seed → (${Math.round(sx)}, ${Math.round(sy)}) · Click Apply`);
  };

  const downloadResult = () => {
    const pc = procRef.current;
    if (!pc.width) return;
    const a = document.createElement('a'); a.href = pc.toDataURL('image/png'); a.download = `cv-${selected?.id || 'output'}.png`; a.click();
  };

  const toggleCat = (id) => setExpandedCats(e => ({ ...e, [id]: !e[id] }));
  const toggleSub = (key) => setExpandedSubs(e => ({ ...e, [key]: e[key] === false ? true : false }));

  const catColor = MENU.find(c => c.subs.some(s => s.items?.some(i => i.id === selected?.id)))?.color || '#00d4ff';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: '#060810', color: '#b0b8cc', overflow: 'hidden', fontSize: 12 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Outfit:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: #0a0b14; } ::-webkit-scrollbar-thumb { background: #22253a; border-radius: 2px; }
        .mitem { cursor: pointer; padding: 5px 12px 5px 28px; color: #6870a0; transition: all 0.12s; border-left: 2px solid transparent; }
        .mitem:hover { color: #00d4ff; background: rgba(0,212,255,0.04); }
        .mitem.active { color: var(--ac); background: rgba(var(--acr),0.08); border-left-color: var(--ac); }
        .cat-hdr { display: flex; align-items: center; gap: 8px; padding: 8px 14px; cursor: pointer; color: #5060a0; font-size: 10px; letter-spacing: 0.12em; font-weight: 600; transition: color 0.15s; user-select: none; }
        .cat-hdr:hover { color: var(--ac); }
        .sub-hdr { padding: 4px 14px 4px 22px; font-size: 9px; color: #35405a; letter-spacing: 0.1em; cursor: pointer; display: flex; justify-content: space-between; user-select: none; }
        .sub-hdr:hover { color: #5060a0; }
        .apply-btn { background: transparent; border: 1px solid var(--ac); color: var(--ac); padding: 6px 20px; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 0.1em; transition: all 0.15s; }
        .apply-btn:hover:not(:disabled) { background: var(--ac); color: #060810; }
        .apply-btn:disabled { opacity: 0.35; cursor: default; }
        .upload-btn { background: transparent; border: 1px solid #1e2236; color: #6870a0; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 0.08em; transition: all 0.15s; }
        .upload-btn:hover { border-color: #00d4ff; color: #00d4ff; }
        .drop-zone { border: 1px dashed #1a1e30; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .drop-zone:hover, .drop-zone.drag { border-color: #00d4ff; background: rgba(0,212,255,0.03); }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 2px; background: #1a1e30; border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; background: var(--ac); border-radius: 50%; cursor: pointer; }
        .stat-card { background: #0c0e1a; border: 1px solid #16192a; border-radius: 6px; padding: 10px 14px; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        canvas { image-rendering: pixelated; }
      `}</style>

      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      {/* ── SIDEBAR ── */}
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
              <div key={cat.id} style={{ '--ac': ac } as any}>
                <div className="cat-hdr" style={{ '--ac': ac } as any} onClick={() => toggleCat(cat.id)}>
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
                          style={{ '--ac': ac, '--acr': ac === '#00d4ff' ? '0,212,255' : ac === '#a78bfa' ? '167,139,250' : ac === '#34d399' ? '52,211,153' : '245,158,11' } as any}
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

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ height: 46, background: '#090a14', borderBottom: '1px solid #12152a', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flexShrink: 0 }}>
          <button className="upload-btn" onClick={() => fileRef.current.click()}>UPLOAD</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) loadFile(e.target.files[0]); e.target.value = ''; }} />

          {imgDims && <div style={{ fontSize: 9, color: '#35405a', paddingLeft: 4 }}>{imgDims.w}×{imgDims.h}</div>}

          <div style={{ flex: 1 }} />

          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: '#0c0e1a', borderRadius: 3, border: '1px solid #16192a' }}>
              <span style={{ fontSize: 9, color: '#35405a' }}>OP</span>
              <span style={{ fontSize: 10, color: catColor }}>{selected.label}</span>
            </div>
          )}

          {elapsed && <div style={{ fontSize: 9, color: '#39d98a', padding: '0 4px' }}>{elapsed}ms</div>}

          <button className="apply-btn" style={{ '--ac': catColor } as any} onClick={applyOp} disabled={!imgData || !selected || processing}>
            {processing ? '◌ RUNNING' : '▶ APPLY'}
          </button>

          <button className="upload-btn" onClick={downloadResult} disabled={!imgData}>SAVE PNG</button>
        </div>

        {/* Canvas Row */}
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

        {/* Param Controls */}
        {selected && selected.params.length > 0 && (
          <div style={{ background: '#090a14', borderTop: '1px solid #12152a', padding: '10px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
            {selected.params.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                <div style={{ fontSize: 9, color: '#55608a', minWidth: 80, whiteSpace: 'nowrap' }}>{p.label}</div>
                <input
                  type="range" min={p.min} max={p.max} step={p.step}
                  value={params[p.key] ?? p.def}
                  onChange={e => setParams(ps => ({ ...ps, [p.key]: parseFloat(e.target.value) }))}
                  style={{ flex: 1, '--ac': catColor } as any}
                />
                <div style={{ fontSize: 11, color: catColor, minWidth: 36, textAlign: 'right', fontWeight: 500 }}>
                  {params[p.key] ?? p.def}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Histogram */}
        <div style={{ height: 56, background: '#060810', borderTop: '1px solid #0e1020', flexShrink: 0, overflow: 'hidden' }}>
          {imgData ? <Histogram imgData={imgData} /> : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#1e2236', letterSpacing: '0.1em' }}>HISTOGRAM</div>
          )}
        </div>
      </div>
    </div>
  );
}