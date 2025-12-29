'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import AlignmentGuide from './AlignmentGuide';
import DataModal from './DataModal';
import CropperModal from './CropperModal';
import { preprocessImage, correctTicketText, extractTicketData, TicketData } from '@/utils/ocr';

export default function OCRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [showGuide, setShowGuide] = useState(true);
  const [preprocess, setPreprocess] = useState(true);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState('');
  const [ocrText, setOcrText] = useState('Processing...');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<TicketData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'environment',
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setCameraError('Camera error: ' + (err as Error).message);
      }
    };

    initCamera();

    return () => {
      // Cleanup camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImageUrl(imageDataUrl);
    setShowCropperModal(true);
  }, []);

  const handleCropConfirm = useCallback(
    async (croppedDataUrl: string) => {
      setIsOcrProcessing(true);
      setProcessingProgress(0);
      setOcrText('Processing...');
      setConfidence(null);
      setExtractedData(null);

      // Apply preprocessing if enabled
      let processedDataUrl = croppedDataUrl;
      if (preprocess && previewCanvasRef.current) {
        const img = new Image();
        img.onload = async () => {
          const previewCanvas = previewCanvasRef.current;
          if (!previewCanvas) return;

          previewCanvas.width = img.width;
          previewCanvas.height = img.height;
          const ctx = previewCanvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const processedData = preprocessImage(imageData);
          ctx.putImageData(processedData, 0, 0);

          setShowPreview(true);
          processedDataUrl = previewCanvas.toDataURL('image/png');
          await runOCR(processedDataUrl);
        };
        img.src = croppedDataUrl;
      } else {
        setShowPreview(false);
        await runOCR(croppedDataUrl);
      }
    },
    [preprocess]
  );

  const runOCR = async (imageDataUrl: string) => {
    try {
      const result = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            setProcessingProgress(progress);
            setOcrText(`Processing... ${progress}%`);
          }
        },
      });

      const correctedText = correctTicketText(result.data.text.trim());
      setOcrText(correctedText || 'No text detected.');
      setConfidence(result.data.confidence);

      const data = extractTicketData(correctedText);
      setExtractedData(data);
      setProcessingProgress(100);

      // Close cropper and show data modal after processing is complete
      setTimeout(() => {
        setIsOcrProcessing(false);
        setShowCropperModal(false);
        setShowDataModal(true);
      }, 500);
    } catch (err) {
      setOcrText('Error: ' + (err as Error).message);
      setProcessingProgress(0);
      setIsOcrProcessing(false);
    }
  };

  const handleCloseDataModal = () => {
    setShowDataModal(false);
    setShowCropperModal(false);
    setIsOcrProcessing(false);
    setOcrText('Processing...');
    setConfidence(null);
    setExtractedData(null);
    setShowPreview(false);
    setProcessingProgress(0);
  };

  const handleScanAgain = () => {
    // Close data modal and cropper modal to return to camera view
    handleCloseDataModal();
  };

  if (cameraError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-red-500 text-center p-4">
          <p className="text-xl mb-2">Camera Error</p>
          <p>{cameraError}</p>
          <p className="mt-4 text-sm text-gray-400">
            Please ensure you have granted camera permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen Camera View */}
      <div className="fixed inset-0 z-10">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Alignment Guide Overlay */}
        <AlignmentGuide show={showGuide} />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-light">OCR Scanner</h1>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGuide}
                  onChange={(e) => setShowGuide(e.target.checked)}
                  className="w-4 h-4 accent-green-500 rounded"
                />
                <span>Guide</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={preprocess}
                  onChange={(e) => setPreprocess(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span>Enhance</span>
              </label>
            </div>
          </div>
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={handleCapture}
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg active:scale-95 transition-transform flex items-center justify-center"
          >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-400"></div>
          </button>
        </div>
      </div>

      {/* Cropper Modal */}
      <CropperModal
        isOpen={showCropperModal}
        onClose={() => setShowCropperModal(false)}
        imageDataUrl={capturedImageUrl}
        onConfirm={handleCropConfirm}
        isProcessing={isOcrProcessing}
        processingProgress={processingProgress}
      />

      {/* Data Modal */}
      <DataModal
        isOpen={showDataModal}
        onClose={handleCloseDataModal}
        data={extractedData}
        processingProgress={processingProgress}
        isProcessing={processingProgress < 100 && processingProgress > 0}
        onScanAgain={handleScanAgain}
      />

      {/* Hidden Canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />
    </>
  );
}
