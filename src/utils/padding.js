//  PADDING
// ═══════════════════════════════════════════════
export function padImage(id, padSize, mode) {
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
