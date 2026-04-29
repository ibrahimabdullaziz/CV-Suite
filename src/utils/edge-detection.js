import { clamp, toGray } from "./engine";
import { gaussianFilter } from "./filters";

//  EDGE DETECTION
// ═══════════════════════════════════════════════
export function sobelFilter(id) {
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

export function prewittFilter(id) {
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

export function laplacianFilter(id) {
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

export function cannyFilter(id, lo = 50, hi = 150) {
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
