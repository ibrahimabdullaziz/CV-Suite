# CV Suite - Code & Algorithm Explainer

This document serves as a study guide for the algorithms and architectural patterns used in the CV Suite.

## 1. Core Engine (`src/utils/engine.js`)

The "heart" of the suite is the **Convolution Engine**.

### Convolution Algorithm
Convolution is the process of applying a "kernel" (a small matrix of numbers) to every pixel in an image to produce a new image.
```javascript
export function convolve(imgData, kernel, kSize) {
  // ... iterates through every pixel (x, y)
  // ... for each pixel, it looks at its neighbors defined by kSize
  // ... multiplies neighbor values by the kernel weights and sums them up
}
```
- **Padding**: When the kernel is at the edge of the image, the engine "clamps" the coordinates to the nearest valid pixel, ensuring the algorithm doesn't crash or create black borders.

---

## 2. Image Processing Algorithms

### A. Linear Filters (`src/utils/filters.js`)
These use the convolution engine.
- **Mean Filter**: Every weight in the kernel is `1`. It averages the neighborhood, causing a blur effect.
- **Gaussian Filter**: Uses a kernel based on the Gaussian (Normal) distribution. It blurs images while preserving edges better than a mean filter.

### B. Non-Linear Filters (`src/utils/filters.js`)
These do *not* use simple multiplication/summation.
- **Median Filter**: Replaces the pixel with the *median* value of its neighbors. Excellent for removing "salt and pepper" noise.
- **Max/Min Filters**: Also known as **Dilation** and **Erosion**. They expand or shrink bright/dark areas.

### C. Edge Detection (`src/utils/edge-detection.js`)
- **Sobel/Prewitt**: Calculate the "gradient" (rate of change) in both X and Y directions. High gradient = Edge.
- **Canny Edge Detection**: The most complex. It involves:
  1. Noise reduction (Gaussian Blur).
  2. Gradient calculation.
  3. Non-maximum suppression (thinning the edges).
  4. Hysteresis thresholding (connecting weak edges to strong ones).

### D. Segmentation (`src/utils/segmentation.js`)
- **Otsu's Method**: Automatically finds the best threshold value to separate an image into background and foreground by maximizing inter-class variance.
- **K-Means Clustering**: Groups pixels into `K` groups based on color similarity.
- **Region Growing**: Starts from a "seed" pixel and expands to neighbors that have a similar color (within a tolerance).

### E. Compression Analysis (`src/utils/compression.js`)
- **RLE (Run-Length Encoding)**: Replaces strings of identical pixels with `(count, value)`.
- **Huffman Coding**: A statistical compression that gives shorter codes to more frequent colors.
- **LZW**: Builds a "dictionary" of patterns found in the image.

---

## 3. React Architecture (`src/app/page.js`)

The application uses a **Component-Based Architecture** to keep logic separated from the UI.

### State Flow
1. **Selection**: User selects an operation from the `Sidebar`.
2. **Parameters**: `ParamControls` updates the local `params` state.
3. **Execution**: When "Apply" is clicked, `applyOp` (a `useCallback`) is triggered.
4. **Strategy Pattern**: `applyOp` uses a `switch` statement to delegate the work to the correct utility function in `src/utils/`.
5. **Rendering**: The result is painted directly onto a `<canvas>` element via `putImageData` for maximum performance.

### Canvas Integration
Since React is designed for DOM elements, we use `useRef` to get direct access to the HTML5 Canvas API. The `useEffect` hook in `page.js` ensures that whenever `imgData` changes (like on initial upload), the canvas is correctly resized and redrawn.

---

## 📖 Key Study Tips
- Look at `convolve` in `engine.js` to understand how kernels work.
- Compare `sobelFilter` in `edge-detection.js` with `meanFilter` in `filters.js` to see the difference between spatial filters and gradient operators.
- Check `otsuSegment` in `segmentation.js` to see how histograms are used to find optimal thresholds.
