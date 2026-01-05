'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import AlignmentGuide from './AlignmentGuide';
import DataModal from './DataModal';
import CropperModal from './CropperModal';
import { preprocessImage, correctTicketText, extractTicketData, TicketData } from '@/utils/ocr';
import { preprocessImageAdvanced, canvasToDataUrl, AdvancedProcessingOptions } from '@/utils/advancedImageProcessing';
import { logOcrDebug, analyzeOcrQuality, DebugInfo } from '@/utils/ocrDebug';

export default function OCRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [showGuide, setShowGuide] = useState(true);
  const [preprocess, setPreprocess] = useState(true);
  const [useAdvancedProcessing, setUseAdvancedProcessing] = useState(false); // Default to OFF until fixed
  const [showDataModal, setShowDataModal] = useState(false);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState('');
  const [ocrText, setOcrText] = useState('Processing...');
  const [rawOcrText, setRawOcrText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<TicketData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

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
    setShowDataModal(false);
    setShowCropperModal(true);
  }, []);

  const handleCropConfirm = useCallback(
    async (croppedDataUrl: string) => {
      setIsOcrProcessing(true);
      setProcessingProgress(0);
      setOcrText('Processing...');
      setRawOcrText('');
      setConfidence(null);
      setExtractedData(null);

      // console.log('%c========== Image Preprocessing Started ==========', 'color: #0066FF; font-weight: bold; font-size: 14px');

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

          // console.log('%c📊 Image Preprocessing', 'color: #0066FF; font-weight: bold; font-size: 13px');
          // console.log('Image dimensions:', img.width, 'x', img.height);
          // console.log('Preprocessing enabled:', preprocess);
          // console.log('Advanced processing enabled:', useAdvancedProcessing);

          try {
            // Use advanced processing if enabled, otherwise use legacy preprocessing
            if (useAdvancedProcessing) {
              setOcrText('Optimizing image...');
              // console.log('%c🚀 Using ADVANCED preprocessing pipeline', 'color: #FF6600; font-weight: bold');
              const advancedOptions: AdvancedProcessingOptions = {
                targetDpi: 300,
                targetTextHeight: 32,
                enableDeskew: false,  // Disabled - can destroy text
                enableIlluminationFix: true,
                enableBinarization: false, // Disabled - handled by legacy preprocessing
                enableDenoising: true,
                enableUnsharpMask: false, // Disabled - can cause artifacts
                unsharpMaskRadius: 6.8,
                unsharpMaskAmount: 2.69,
                unsharpMaskThreshold: 0,
                resizeBeforeProcessing: true,
              };

              await preprocessImageAdvanced(previewCanvas, advancedOptions);
            } else {
              // Use legacy preprocessing - simpler and more reliable
              // console.log('%c⚙️ Using LEGACY preprocessing pipeline', 'color: #00AA00; font-weight: bold');
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const processedData = preprocessImage(imageData);
              ctx.putImageData(processedData, 0, 0);
              // console.log('✓ Legacy preprocessing applied');
            }

            setShowPreview(true);
            processedDataUrl = canvasToDataUrl(previewCanvas, 'png');
            // console.log('%c========== Image Preprocessing Completed ==========', 'color: #0066FF; font-weight: bold; font-size: 14px');
            // console.log('Processed image data URL length:', processedDataUrl.length);
            
            await runOCR(processedDataUrl);
          } catch (error) {
            console.error('Error during preprocessing:', error);
            setOcrText('Preprocessing error: ' + (error as Error).message);
            setIsOcrProcessing(false);
          }
        };
        img.src = croppedDataUrl;
      } else {
        // console.log('%c⏭️ Skipping preprocessing - using raw image', 'color: #FF0000; font-weight: bold');
        setShowPreview(false);
        await runOCR(croppedDataUrl);
      }
    },
    [preprocess, useAdvancedProcessing]
  );

  const runOCR = async (imageDataUrl: string) => {
    const startTime = Date.now();
    try {
      setOcrText('Recognizing text...');
      // console.log('%c========== OCR Processing Started ==========', 'color: #00AA00; font-weight: bold; font-size: 14px');
      
      const result = await Tesseract.recognize(imageDataUrl, 'eng', {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core-simd-lstm.wasm.js',
        langPath: '/tesseract/lang/',
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            setProcessingProgress(progress);
            setOcrText(`Recognizing text... ${progress}%`);
          }
        },
      });

      const rawText = result.data.text.trim();
      const processingTime = Date.now() - startTime;
      
      // Store raw OCR text for debugging
      setRawOcrText(rawText);
      
      // Comprehensive logging
      // console.group('%c📸 RAW OCR OUTPUT', 'color: #0099FF; font-weight: bold; font-size: 13px');
      // console.log('%cText Length:', 'font-weight: bold', rawText.length, 'characters');
      // console.log('%cConfidence Score:', 'font-weight: bold', result.data.confidence.toFixed(2) + '%');
      // console.log('%cProcessing Time:', 'font-weight: bold', processingTime + 'ms');
      // console.log('%cRaw Text (plain):', 'font-weight: bold');
      // console.log(rawText);
      // console.log('%cRaw Text (with visible whitespace):', 'font-weight: bold');
      // console.log(JSON.stringify(rawText, null, 2));
      // console.log('%cText by line:', 'font-weight: bold');
      // rawText.split('\n').forEach((line, idx) => {
      //   if (line.trim()) {
      //     console.log(`  Line ${idx}: "${line}"`);
      //   }
      // });
      // console.groupEnd();

      // Apply text corrections
      const correctedText = correctTicketText(rawText);
      setOcrText(correctedText || 'No text detected.');
      setConfidence(result.data.confidence);

      // console.group('%c✏️ AFTER TEXT CORRECTION', 'color: #FF9900; font-weight: bold; font-size: 13px');
      // console.log('%cCorrected Text Length:', 'font-weight: bold', correctedText.length, 'characters');
      // console.log('%cCorrected Text:', 'font-weight: bold');
      // console.log(correctedText);
      // console.groupEnd();

      // Extract ticket data
      const data = extractTicketData(correctedText);
      setExtractedData(data);
      
      // console.group('%c📋 EXTRACTED DATA', 'color: #9900FF; font-weight: bold; font-size: 13px');
      // Object.entries(data).forEach(([key, value]) => {
      //   const status = value ? '✓' : '✗';
      //   console.log(`${status} ${key}:`, value || '(empty)');
      // });
      // console.log('%cFull Data Object:', 'font-weight: bold', data);
      // console.groupEnd();
      
      // Analyze quality
      const quality = analyzeOcrQuality(rawText, result.data.confidence);
      // console.group('%c🔍 QUALITY ANALYSIS', 'color: #FF6600; font-weight: bold; font-size: 13px');
      // console.log('%cQuality Score:', 'font-weight: bold', quality.score + '/100');
      // console.log('%cIssues:', 'font-weight: bold', quality.issues);
      // console.log('%cSuggestions:', 'font-weight: bold', quality.suggestions);
      // console.groupEnd();

      // console.log('%c========== OCR Processing Completed ==========', 'color: #00AA00; font-weight: bold; font-size: 14px');

      setProcessingProgress(100);

      // Close cropper and show data modal after processing is complete
      setTimeout(() => {
        setIsOcrProcessing(false);
        setShowCropperModal(false);
        setShowDataModal(true);
      }, 500);
    } catch (err) {
      const errorMsg = (err as Error).message;
      // console.error('%c❌ OCR ERROR:', 'color: #FF0000; font-weight: bold; font-size: 13px', err);
      // console.error('Error Details:', {
      //   message: errorMsg,
      //   stack: (err as Error).stack,
      // });
      setOcrText('Error: ' + errorMsg);
      setProcessingProgress(0);
      setIsOcrProcessing(false);
    }
  };

  const handleCloseCropperModal = useCallback(() => {
    setShowCropperModal(false);
    setIsOcrProcessing(false);
    setProcessingProgress(0);
  }, []);

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
            <div className="flex gap-3 flex-wrap justify-end">
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
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAdvancedProcessing}
                  onChange={(e) => setUseAdvancedProcessing(e.target.checked)}
                  disabled={!preprocess}
                  className="w-4 h-4 accent-purple-500 rounded disabled:opacity-50"
                />
                <span>Advanced</span>
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
        onClose={handleCloseCropperModal}
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
        ocrText={ocrText}
        capturedImageUrl={capturedImageUrl}
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
