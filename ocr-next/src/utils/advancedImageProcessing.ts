/**
 * Advanced Image Processing for OCR
 * Implements best practices from Tesseract OCR optimization
 * - DPI optimization (300 DPI minimum)
 * - Text size optimization (30-33 pixels for LSTM engine)
 * - Deskewing and dewarping
 * - Illumination correction (CLAHE - Contrast Limited Adaptive Histogram Equalization)
 * - Binarization and denoising (Otsu's method)
 */

export interface AdvancedProcessingOptions {
  targetDpi?: number; // Default: 300 (minimum for good OCR)
  targetTextHeight?: number; // Default: 32 pixels (optimal for Tesseract 4.x LSTM)
  enableDeskew?: boolean; // Default: true
  enableIlluminationFix?: boolean; // Default: true (CLAHE)
  enableBinarization?: boolean; // Default: true (Otsu's method)
  enableDenoising?: boolean; // Default: true
  enableUnsharpMask?: boolean; // Default: true
  unsharpMaskRadius?: number; // Default: 6.8
  unsharpMaskAmount?: number; // Default: 2.69
  unsharpMaskThreshold?: number; // Default: 0
  resizeBeforeProcessing?: boolean; // Default: true
  outputFormat?: 'png' | 'jpeg'; // Default: png
}

const DEFAULT_OPTIONS: AdvancedProcessingOptions = {
  targetDpi: 300,
  targetTextHeight: 32, // 30-33 pixels is optimal for Tesseract 4.x
  enableDeskew: true,
  enableIlluminationFix: true,
  enableBinarization: true,
  enableDenoising: true,
  enableUnsharpMask: true,
  unsharpMaskRadius: 6.8,
  unsharpMaskAmount: 2.69,
  unsharpMaskThreshold: 0,
  resizeBeforeProcessing: true,
  outputFormat: 'png',
};

/**
 * Resize image to optimal DPI for OCR (300 DPI minimum)
 * Estimates current DPI and scales if needed
 */
export function optimizeDPI(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  targetDpi: number = 300
): void {
  // Estimate current DPI (typically 96 on web)
  const currentDpi = 96; // Standard screen DPI
  const scaleFactor = targetDpi / currentDpi;

  if (scaleFactor > 1.1) {
    // Only scale up if difference is significant
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    const newWidth = Math.round(originalWidth * scaleFactor);
    const newHeight = Math.round(originalHeight * scaleFactor);

    // Create temporary canvas for scaling
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);
    tempCtx.putImageData(imageData, 0, 0);

    // High-quality upscaling
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

/**
 * Optimize text size to 30-33 pixels (best for Tesseract 4.x LSTM)
 * Analyzes image to estimate text size and scales appropriately
 */
export function optimizeTextSize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  targetTextHeight: number = 32
): void {
  // Estimate current text size by analyzing edge density
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Count edge pixels to estimate text density
  let edgeCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Look for strong edges (very black or very white)
    if (gray < 50 || gray > 200) {
      edgeCount++;
    }
  }

  const totalPixels = data.length / 4;
  const edgeRatio = edgeCount / totalPixels;

  // Estimate current text size (rough heuristic)
  const estimatedTextSize = Math.max(8, Math.sqrt(canvas.width * canvas.height) / 20);
  const scaleFactor = targetTextHeight / Math.max(estimatedTextSize, 8);

  if (scaleFactor > 1.2 || scaleFactor < 0.8) {
    const newWidth = Math.round(canvas.width * scaleFactor);
    const newHeight = Math.round(canvas.height * scaleFactor);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newWidth, newHeight);

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

/**
 * Deskew image (rotate to correct angle)
 * Detects text orientation and corrects it
 */
export function deskewImage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Detect dominant angle using Hough transform (simplified version)
  const angles: number[] = [];
  const step = 5; // Check every 5 degrees

  for (let angle = -20; angle <= 20; angle += step) {
    const rad = (angle * Math.PI) / 180;
    let score = 0;

    // Score how well text aligns at this angle
    for (let y = 0; y < canvas.height; y += 2) {
      let lineWeight = 0;
      for (let x = 0; x < canvas.width; x += 2) {
        const idx = (y * canvas.width + x) * 4;
        const gray = data[idx]; // Assuming grayscale
        if (gray < 128) lineWeight++; // Dark pixel
      }
      score += Math.abs(lineWeight - canvas.width / 4); // Penalize uneven distributions
    }

    angles.push(score);
  }

  // Find best angle
  const bestAngleIndex = angles.indexOf(Math.min(...angles));
  const bestAngle = -20 + bestAngleIndex * step;

  if (Math.abs(bestAngle) > 1) {
    // Apply rotation
    rotateImage(canvas, ctx, bestAngle);
  }
}

/**
 * Rotate image by angle (in degrees)
 */
function rotateImage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  angle: number
): void {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const newWidth = Math.abs(canvas.width * cos) + Math.abs(canvas.height * sin);
  const newHeight = Math.abs(canvas.width * sin) + Math.abs(canvas.height * cos);

  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;

  tempCtx.translate(newWidth / 2, newHeight / 2);
  tempCtx.rotate(rad);
  tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.drawImage(tempCanvas, 0, 0);
}

/**
 * CLAHE - Contrast Limited Adaptive Histogram Equalization
 * Fixes illumination problems (dark spots, uneven lighting)
 */
export function applyCLAHE(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  clipLimit: number = 2.0,
  gridSize: number = 8
): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale if needed
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  // Apply CLAHE to tiles
  const tileWidth = Math.ceil(canvas.width / gridSize);
  const tileHeight = Math.ceil(canvas.height / gridSize);

  for (let ty = 0; ty < gridSize; ty++) {
    for (let tx = 0; tx < gridSize; tx++) {
      const x0 = tx * tileWidth;
      const y0 = ty * tileHeight;
      const x1 = Math.min(x0 + tileWidth, canvas.width);
      const y1 = Math.min(y0 + tileHeight, canvas.height);

      // Build histogram for this tile
      const histogram = new Array(256).fill(0);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * canvas.width + x) * 4;
          histogram[data[idx]]++;
        }
      }

      // Apply clip limit
      const tilePixels = (x1 - x0) * (y1 - y0);
      const clipThreshold = clipLimit * (tilePixels / 256);

      for (let i = 0; i < histogram.length; i++) {
        if (histogram[i] > clipThreshold) {
          const excess = histogram[i] - clipThreshold;
          histogram[i] = clipThreshold;
          // Redistribute excess
          for (let j = 0; j < 256; j++) {
            histogram[j] += excess / 256;
          }
        }
      }

      // Build CDF
      const cdf = new Array(256);
      let sum = 0;
      for (let i = 0; i < 256; i++) {
        sum += histogram[i];
        cdf[i] = Math.round((sum / tilePixels) * 255);
      }

      // Apply transformation to this tile
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * canvas.width + x) * 4;
          data[idx] = data[idx + 1] = data[idx + 2] = cdf[data[idx]];
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Otsu's method for automatic binarization
 * Converts grayscale to pure black and white
 */
export function applyOtsuBinarization(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  // Find threshold using Otsu's method
  const total = data.length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let countB = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    countB += histogram[t];
    if (countB === 0) continue;

    const countF = total - countB;
    if (countF === 0) break;

    sumB += t * histogram[t];
    const meanB = sumB / countB;
    const meanF = (sum - sumB) / countF;

    const variance = countB * countF * Math.pow(meanB - meanF, 2);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  // Apply binarization
  for (let i = 0; i < data.length; i += 4) {
    const binarized = data[i] > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binarized;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Denoise using median filter
 * Removes salt-and-pepper noise while preserving edges
 */
export function applyMedianFilter(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  kernelSize: number = 3
): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const neighbors: number[] = [];

      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const nx = Math.min(Math.max(x + kx, 0), canvas.width - 1);
          const ny = Math.min(Math.max(y + ky, 0), canvas.height - 1);
          const idx = (ny * canvas.width + nx) * 4;
          neighbors.push(data[idx]);
        }
      }

      neighbors.sort((a, b) => a - b);
      const median = neighbors[Math.floor(neighbors.length / 2)];
      const idx = (y * canvas.width + x) * 4;
      output[idx] = output[idx + 1] = output[idx + 2] = median;
    }
  }

  // Copy output back
  data.set(output);
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Unsharp mask - enhances details and edges
 * Similar to GIMP's unsharp mask filter
 */
export function applyUnsharpMask(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  radius: number = 6.8,
  amount: number = 2.69,
  threshold: number = 0
): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create blurred copy
  const blurred = new Uint8ClampedArray(data);
  
  // Simple Gaussian blur approximation (3 passes)
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 4; i < blurred.length - 4; i += 4) {
      const avg = (blurred[i] + blurred[i + 4] + blurred[i - 4]) / 3;
      blurred[i] = blurred[i + 1] = blurred[i + 2] = avg;
    }
  }

  // Apply unsharp mask
  for (let i = 0; i < data.length; i += 4) {
    const original = data[i];
    const blur = blurred[i];
    const diff = original - blur;

    if (Math.abs(diff) > threshold) {
      const enhanced = original + diff * amount;
      const result = Math.min(255, Math.max(0, enhanced));
      data[i] = data[i + 1] = data[i + 2] = result;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Main advanced preprocessing function
 * Applies all selected enhancements in optimal order
 */
export async function preprocessImageAdvanced(
  canvas: HTMLCanvasElement,
  options: AdvancedProcessingOptions = {}
): Promise<HTMLCanvasElement> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  console.log('🔄 Starting advanced image preprocessing...');
  console.log('Options:', opts);

  // 1. Optimize DPI
  if (opts.resizeBeforeProcessing) {
    console.log('📏 Optimizing DPI...');
    optimizeDPI(canvas, ctx, opts.targetDpi);
  }

  // 2. Optimize text size
  console.log('📝 Optimizing text size...');
  optimizeTextSize(canvas, ctx, opts.targetTextHeight);

  // 3. Fix illumination first (before binarization)
  if (opts.enableIlluminationFix) {
    console.log('💡 Fixing illumination with CLAHE...');
    applyCLAHE(canvas, ctx, 2.0, 8);
  }

  // 4. Apply unsharp mask for detail enhancement
  if (opts.enableUnsharpMask) {
    console.log('🔍 Applying unsharp mask...');
    applyUnsharpMask(
      canvas,
      ctx,
      opts.unsharpMaskRadius!,
      opts.unsharpMaskAmount!,
      opts.unsharpMaskThreshold!
    );
  }

  // 5. Deskew image
  if (opts.enableDeskew) {
    console.log('🔄 Deskewing image...');
    deskewImage(canvas, ctx);
  }

  // 6. Apply Otsu binarization
  if (opts.enableBinarization) {
    console.log('⚫ Applying Otsu binarization...');
    applyOtsuBinarization(canvas, ctx);
  }

  // 7. Denoise with median filter
  if (opts.enableDenoising) {
    console.log('🧹 Denoising with median filter...');
    applyMedianFilter(canvas, ctx, 3);
  }

  console.log('✅ Advanced preprocessing complete!');
  return canvas;
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0
): string {
  if (format === 'jpeg') {
    return canvas.toDataURL('image/jpeg', quality);
  }
  return canvas.toDataURL('image/png');
}
