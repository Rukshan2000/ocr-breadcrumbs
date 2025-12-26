import { TicketData } from '@/utils/ocr';

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
  if (!isOpen) return null;

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(ocrText);
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
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
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
  );
}
