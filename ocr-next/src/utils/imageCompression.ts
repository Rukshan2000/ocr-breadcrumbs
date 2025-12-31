/**
 * Image Compression Utilities
 * Handles image compression and resizing to meet size constraints
 */

export interface CompressionOptions {
  maxSizeBytes?: number; // Default: 1MB (1048576 bytes)
  maxWidth?: number; // Default: 1920px
  maxHeight?: number; // Default: 1080px
  initialQuality?: number; // Default: 0.9
}

const DEFAULT_MAX_SIZE_BYTES = 1048576; // 1MB
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1080;
const DEFAULT_INITIAL_QUALITY = 0.9;

/**
 * Compress an image from a data URL to meet size constraints
 * Returns a data URL of the compressed image
 * @param dataUrl - The image data URL to compress
 * @param options - Compression options
 * @returns Promise<string> - The compressed image data URL
 */
export async function compressImage(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    initialQuality = DEFAULT_INITIAL_QUALITY,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Calculate dimensions while maintaining aspect ratio
      let { width, height } = img;
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Start with initial quality and reduce if needed
      let quality = initialQuality;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      let attempts = 0;
      const maxAttempts = 20;
      
      // Iteratively reduce quality until size constraint is met
      while (
        getDataUrlSize(compressedDataUrl) > maxSizeBytes &&
        quality > 0.1 &&
        attempts < maxAttempts
      ) {
        quality -= 0.05;
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        attempts++;
      }
      
      const finalSize = getDataUrlSize(compressedDataUrl);
      
      if (finalSize > maxSizeBytes) {
        console.warn(
          `⚠️ Image compression: Could not compress to ${maxSizeBytes} bytes. ` +
          `Final size: ${finalSize} bytes (${(finalSize / 1024).toFixed(2)} KB). ` +
          `Consider reducing image dimensions further.`
        );
      }
      
      console.log(
        `✅ Image compressed: ${(finalSize / 1024).toFixed(2)} KB ` +
        `(Quality: ${(quality * 100).toFixed(0)}%, Size: ${width}x${height})`
      );
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    try {
      img.src = dataUrl;
    } catch (error) {
      reject(new Error(`Invalid data URL: ${error}`));
    }
  });
}

/**
 * Compress a blob/file to meet size constraints
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<Blob> - The compressed image blob
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  // Convert blob to data URL
  const dataUrl = await blobToDataUrl(file);
  
  // Compress using existing function
  const compressedDataUrl = await compressImage(dataUrl, options);
  
  // Convert back to blob
  const blob = dataUrlToBlob(compressedDataUrl);
  
  return blob;
}

/**
 * Convert a blob to a data URL
 */
function blobToDataUrl(blob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a data URL to a blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Get the size of a data URL in bytes
 */
function getDataUrlSize(dataUrl: string): number {
  // Data URL format: data:mime/type;base64,<encoded-data>
  // The size is approximately the length of the base64 string * 0.75
  const base64 = dataUrl.split(',')[1];
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
