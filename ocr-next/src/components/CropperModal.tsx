import { useEffect, useRef, useCallback, useState } from 'react';

interface CropState {
  isDragging: boolean;
  isResizing: boolean;
  activeHandle: string | null;
  startX: number;
  startY: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  imageScale: number;
  offsetX: number;
  offsetY: number;
  originalImage: HTMLImageElement | null;
}

interface CropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string;
  onConfirm: (croppedDataUrl: string) => void;
  isProcessing?: boolean;
  processingProgress?: number;
}

export default function CropperModal({
  isOpen,
  onClose,
  imageDataUrl,
  onConfirm,
  isProcessing = false,
  processingProgress = 0,
}: CropperModalProps) {
  const cropperContainerRef = useRef<HTMLDivElement>(null);
  const cropperCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const croppedCanvasRef = useRef<HTMLCanvasElement>(null);

  const [cropState, setCropState] = useState<CropState>({
    isDragging: false,
    isResizing: false,
    activeHandle: null,
    startX: 0,
    startY: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    imageScale: 1,
    offsetX: 0,
    offsetY: 0,
    originalImage: null,
  });

  const updateCropArea = useCallback(() => {
    if (cropAreaRef.current) {
      cropAreaRef.current.style.left = cropState.cropX + 'px';
      cropAreaRef.current.style.top = cropState.cropY + 'px';
      cropAreaRef.current.style.width = cropState.cropWidth + 'px';
      cropAreaRef.current.style.height = cropState.cropHeight + 'px';
    }
  }, [cropState.cropX, cropState.cropY, cropState.cropWidth, cropState.cropHeight]);

  useEffect(() => {
    updateCropArea();
  }, [updateCropArea]);

  const initCropperImage = useCallback(() => {
    if (!cropperContainerRef.current || !cropperCanvasRef.current || !imageDataUrl) return;

    const img = new Image();
    img.onload = () => {
      const container = cropperContainerRef.current;
      const canvas = cropperCanvasRef.current;
      if (!container || !canvas) return;

      const containerWidth = container.clientWidth || window.innerWidth;
      const containerHeight = container.clientHeight || window.innerHeight - 140;

      if (containerWidth === 0 || containerHeight === 0) {
        setTimeout(initCropperImage, 100);
        return;
      }

      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const imageScale = Math.min(scaleX, scaleY, 1);

      const displayWidth = img.width * imageScale;
      const displayHeight = img.height * imageScale;

      const offsetX = (containerWidth - displayWidth) / 2;
      const offsetY = (containerHeight - displayHeight) / 2;

      canvas.width = containerWidth;
      canvas.height = containerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, containerWidth, containerHeight);
        ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);
      }

      const margin = 0.1;
      setCropState({
        isDragging: false,
        isResizing: false,
        activeHandle: null,
        startX: 0,
        startY: 0,
        cropX: offsetX + displayWidth * margin,
        cropY: offsetY + displayHeight * margin,
        cropWidth: displayWidth * (1 - 2 * margin),
        cropHeight: displayHeight * (1 - 2 * margin),
        imageScale,
        offsetX,
        offsetY,
        originalImage: img,
      });
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  useEffect(() => {
    if (isOpen && imageDataUrl) {
      setTimeout(initCropperImage, 50);
    }
  }, [isOpen, imageDataUrl, initCropperImage]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const rect = cropperContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const touch = 'touches' in e ? e.touches[0] : e as MouseEvent;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const startCropInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);
    const target = e.target as HTMLElement;
    const handle = target.dataset?.handle;

    if (handle) {
      setCropState((prev) => ({
        ...prev,
        isResizing: true,
        activeHandle: handle,
        startX: pos.x,
        startY: pos.y,
      }));
    } else {
      setCropState((prev) => ({
        ...prev,
        isDragging: true,
        startX: pos.x,
        startY: pos.y,
      }));
    }
  };

  useEffect(() => {
    const moveCropInteraction = (e: MouseEvent | TouchEvent) => {
      if (!cropState.isDragging && !cropState.isResizing) return;
      e.preventDefault();

      const pos = getEventPos(e);
      const deltaX = pos.x - cropState.startX;
      const deltaY = pos.y - cropState.startY;

      const containerWidth = cropperContainerRef.current?.clientWidth || 0;
      const containerHeight = cropperContainerRef.current?.clientHeight || 0;
      const minSize = 50;

      setCropState((prev) => {
        let newState = { ...prev, startX: pos.x, startY: pos.y };

        if (prev.isDragging) {
          newState.cropX = Math.max(0, Math.min(containerWidth - prev.cropWidth, prev.cropX + deltaX));
          newState.cropY = Math.max(0, Math.min(containerHeight - prev.cropHeight, prev.cropY + deltaY));
        } else if (prev.isResizing) {
          const handle = prev.activeHandle;

          if (handle?.includes('l')) {
            const newWidth = prev.cropWidth - deltaX;
            if (newWidth >= minSize && prev.cropX + deltaX >= 0) {
              newState.cropX = prev.cropX + deltaX;
              newState.cropWidth = newWidth;
            }
          }
          if (handle?.includes('r')) {
            const newWidth = prev.cropWidth + deltaX;
            if (newWidth >= minSize && prev.cropX + newWidth <= containerWidth) {
              newState.cropWidth = newWidth;
            }
          }
          if (handle?.includes('t')) {
            const newHeight = prev.cropHeight - deltaY;
            if (newHeight >= minSize && prev.cropY + deltaY >= 0) {
              newState.cropY = prev.cropY + deltaY;
              newState.cropHeight = newHeight;
            }
          }
          if (handle?.includes('b')) {
            const newHeight = prev.cropHeight + deltaY;
            if (newHeight >= minSize && prev.cropY + newHeight <= containerHeight) {
              newState.cropHeight = newHeight;
            }
          }
        }

        return newState;
      });
    };

    const endCropInteraction = () => {
      setCropState((prev) => ({
        ...prev,
        isDragging: false,
        isResizing: false,
        activeHandle: null,
      }));
    };

    document.addEventListener('mousemove', moveCropInteraction);
    document.addEventListener('touchmove', moveCropInteraction, { passive: false });
    document.addEventListener('mouseup', endCropInteraction);
    document.addEventListener('touchend', endCropInteraction);

    return () => {
      document.removeEventListener('mousemove', moveCropInteraction);
      document.removeEventListener('touchmove', moveCropInteraction);
      document.removeEventListener('mouseup', endCropInteraction);
      document.removeEventListener('touchend', endCropInteraction);
    };
  }, [cropState.isDragging, cropState.isResizing, cropState.startX, cropState.startY, cropState.activeHandle]);

  const handleReset = () => {
    if (!cropState.originalImage) return;

    const containerWidth = cropperContainerRef.current?.clientWidth || 0;
    const containerHeight = cropperContainerRef.current?.clientHeight || 0;
    const displayWidth = cropState.originalImage.width * cropState.imageScale;
    const displayHeight = cropState.originalImage.height * cropState.imageScale;

    const margin = 0.1;
    setCropState((prev) => ({
      ...prev,
      cropX: prev.offsetX + displayWidth * margin,
      cropY: prev.offsetY + displayHeight * margin,
      cropWidth: displayWidth * (1 - 2 * margin),
      cropHeight: displayHeight * (1 - 2 * margin),
    }));
  };

  const handleConfirm = () => {
    if (!cropState.originalImage || !croppedCanvasRef.current || isProcessing) return;

    const scaleBack = 1 / cropState.imageScale;
    const sourceX = (cropState.cropX - cropState.offsetX) * scaleBack;
    const sourceY = (cropState.cropY - cropState.offsetY) * scaleBack;
    const sourceWidth = cropState.cropWidth * scaleBack;
    const sourceHeight = cropState.cropHeight * scaleBack;

    const croppedCanvas = croppedCanvasRef.current;
    croppedCanvas.width = sourceWidth;
    croppedCanvas.height = sourceHeight;
    const ctx = croppedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        cropState.originalImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );
    }

    const croppedDataUrl = croppedCanvas.toDataURL('image/png');
    onConfirm(croppedDataUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black"></div>
      <div className="relative h-full flex flex-col">
        {/* Cropper Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/80 z-10">
          <h2 className="text-lg font-medium">Select Area to Scan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cropper Canvas Container */}
        <div
          ref={cropperContainerRef}
          className="flex-1 relative overflow-hidden"
          style={{ minHeight: '300px' }}
        >
          <canvas ref={cropperCanvasRef} className="absolute top-0 left-0 w-full h-full" />
          {/* Crop selection area */}
          <div
            ref={cropAreaRef}
            className="crop-area"
            style={{ display: cropState.originalImage ? 'block' : 'none' }}
            onMouseDown={startCropInteraction}
            onTouchStart={startCropInteraction}
          >
            <div className="crop-handle crop-handle-tl" data-handle="tl"></div>
            <div className="crop-handle crop-handle-tr" data-handle="tr"></div>
            <div className="crop-handle crop-handle-bl" data-handle="bl"></div>
            <div className="crop-handle crop-handle-br" data-handle="br"></div>
          </div>
        </div>

        {/* Cropper Actions */}
        <div className="p-4 border-t border-gray-800 bg-black/80">
          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-medium">Processing...</span>
                <span className="text-xl font-bold text-blue-400">{processingProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-lg h-4 overflow-hidden shadow-lg">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 shadow-inner"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-400 mt-2">Scanning and extracting text...</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Scan Selected Area'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Canvas for cropping */}
      <canvas ref={croppedCanvasRef} className="hidden" />
    </div>
  );
}