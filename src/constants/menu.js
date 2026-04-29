// ═══════════════════════════════════════════════
//  MENU STRUCTURE
// ═══════════════════════════════════════════════
export const MENU = [
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

