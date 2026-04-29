import { toGray, clamp, gaussianFilter } from "./engine";
import { sobelFilter, cannyFilter } from "./edge-detection";

//  SEGMENTATION
// ═══════════════════════════════════════════════
export function otsuSegment(id) {
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

export function adaptiveSegment(id, blockSize = 15, C = 5) {
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

export function regionGrowing(id, seedX, seedY, thresh = 30) {
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

export function kMeansSegment(id, k = 4) {
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

export function watershedSegment(id) {
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
