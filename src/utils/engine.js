//  UTILITIES
// ═══════════════════════════════════════════════
export const clamp = (v, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, Math.round(v)));
export const toGray = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// ═══════════════════════════════════════════════
//  CONVOLUTION ENGINE
// ═══════════════════════════════════════════════
export function convolve(imgData, kernel, kSize) {
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

export function gaussKernel(size, sigma) {
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
