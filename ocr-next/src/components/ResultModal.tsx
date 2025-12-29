'use client';

import { useEffect, useState } from 'react';
import { TicketData, convertToApiPayload } from '@/utils/ocr';
import { createTicket, testApiConnection } from '@/lib/api';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocrText: string;
  confidence: number | null;
  onViewData: () => void;
  extractedData: TicketData | null;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  showPreview: boolean;
}

export default function ResultModal({
  isOpen,
  onClose,
  ocrText,
  confidence,
  onViewData,
  extractedData,
  previewCanvasRef,
  showPreview,
}: ResultModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'failed'>('checking');

  // Test API connection when modal opens
  useEffect(() => {
    if (isOpen) {
      testApiConnection()
        .then((connected) => {
          setApiStatus(connected ? 'connected' : 'failed');
          if (!connected) {
            console.warn('⚠️ Backend API may not be available');
          }
        })
        .catch((err) => {
          setApiStatus('failed');
          console.error('API test error:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(ocrText);
  };

  const handleSaveTicket = async () => {
    if (!extractedData) {
      setSaveStatus({ type: 'error', message: 'No extracted data to save' });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      // Convert extracted OCR data to API format
      const payload = convertToApiPayload(extractedData, ocrText, confidence);
      
      console.log('Payload to send:', payload);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

      // Send to backend API
      await createTicket(payload);

      setSaveStatus({
        type: 'success',
        message: `✓ Ticket saved successfully (Trace: ${payload.trace_no})`,
      });

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Full error object:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save ticket';
      setSaveStatus({ type: 'error', message: `✗ ${errorMessage}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
      <div className="relative h-full flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium">Result</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Processed Image Preview */}
        {showPreview && (
          <div className="p-4">
            <canvas
              ref={previewCanvasRef}
              className="w-full max-h-48 object-contain rounded-lg bg-gray-900"
            />
          </div>
        )}

        {/* Result Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">
              {confidence !== null ? `Confidence: ${confidence.toFixed(0)}%` : ''}
            </span>
            {extractedData && (
              <button
                onClick={onViewData}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
              >
                View Data
              </button>
            )}
          </div>
          <div className="text-gray-100 whitespace-pre-wrap leading-relaxed text-lg">
            {ocrText}
          </div>

          {/* Status Message */}
          {saveStatus.type && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                saveStatus.type === 'success'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {saveStatus.message}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-gray-800 flex gap-3 flex-col">
          <button
            onClick={handleSaveTicket}
            disabled={isSaving || !extractedData}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save to Database
              </>
            )}
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCopyText}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
            >
              Copy Text
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
            >
              Scan Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
