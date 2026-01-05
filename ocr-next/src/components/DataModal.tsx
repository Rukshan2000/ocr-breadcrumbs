import { TicketData, convertToApiPayload } from '@/utils/ocr';
import { createTicket } from '@/lib/api';
import { compressImage, formatBytes } from '@/utils/imageCompression';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TicketData | null;
  ocrText?: string;
  capturedImageUrl?: string;
  processingProgress?: number;
  isProcessing?: boolean;
  onScanAgain?: () => void;
}

export default function DataModal({ isOpen, onClose, data, ocrText = '', capturedImageUrl = '', processingProgress = 0, isProcessing = false, onScanAgain }: DataModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    isTraceNoMissing?: boolean;
  }>({ type: null, message: '' });
  const [confidence, setConfidence] = useState<number | null>(null);
  const [autoSaveCompleted, setAutoSaveCompleted] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const formatValue = (value: string, placeholder = '--') => {
    if (!value || value === 'RESCAN NEEDED') return placeholder;
    return value;
  };

  // Check for missing critical fields - match what's actually in TicketData interface
  const criticalFields = ['DATE', 'TIME', 'TERMINAL ID', 'LOCATION', 'NO. TICKETS', 'TOTAL AMOUNT', 'TRACE NO'];
  const missingFieldCount = data ? criticalFields.filter(field => {
    const value = data[field as keyof TicketData];
    return !value || value === 'RESCAN NEEDED' || value === '--';
  }).length : 0;

  const hasTooManyMissing = missingFieldCount > 2; // Reduced threshold from 3 to 2

  const extractAmount = (amountStr: string) => {
    if (!amountStr) return '0.00';
    const match = amountStr.match(/([\d,\.]+)/);
    return match ? match[1] : '0.00';
  };

  const extractBalance = (balanceStr: string) => {
    if (!balanceStr) return '0.00';
    const match = balanceStr.match(/([\d,\.]+)/);
    return match ? match[1] : '0.00';
  };

  const extractTraceNo = (traceStr: string) => {
    if (!traceStr) return '--';
    return traceStr.replace(/^TRACE\s+NO[\s\.:]*/, '').trim();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const dateMatch = dateStr.match(/(\d{1,3})-([A-Z]{3})-(\d{4})/i);
    if (dateMatch) {
      let day = parseInt(dateMatch[1]);
      const month = dateMatch[2];
      const year = dateMatch[3];
      
      if (day > 31) {
        day = day % 100;
      }
      
      return `${day.toString().padStart(2, '0')}-${month.toUpperCase()}-${year}`;
    }
    return dateStr;
  };

  const totalAmount = data ? formatValue(data['TOTAL AMOUNT'], 'LKR 0.00') : 'LKR 0.00';
  const amountNum = extractAmount(totalAmount);
  const ticketCount = data ? (parseInt(data['NO. TICKETS']) || 1) : 1;
  const totalAmountNum = parseFloat(amountNum.replace(/,/g, '')) || 0;
  const amountPerPerson = ticketCount > 0 ? (totalAmountNum / ticketCount).toFixed(2) : '0.00';

  const handleSaveTicket = async () => {
    if (!data) {
      setSaveStatus({ type: 'error', message: 'No extracted data to save' });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      const payload = convertToApiPayload(data, ocrText, confidence);
      
      console.log('🔵 Payload to send:', payload);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
      console.log('Image available:', !!capturedImageUrl);

      if (capturedImageUrl) {
        console.log('📸 Uploading ticket with image...');
        
        let imageBlob = await fetch(capturedImageUrl).then(r => r.blob());
        console.log('📦 Original image size:', formatBytes(imageBlob.size));
        console.log('📦 Image MIME type:', imageBlob.type);
        
        console.log('🔄 Compressing image to 1MB...');
        const compressedDataUrl = await compressImage(capturedImageUrl, {
          maxSizeBytes: 1048576,
          maxWidth: 1920,
          maxHeight: 1080,
          initialQuality: 0.9,
        });
        
        const compressedBlob = await fetch(compressedDataUrl).then(r => r.blob());
        console.log('✅ Compressed image size:', formatBytes(compressedBlob.size));
        
        const formData = new FormData();
        formData.append('image', compressedBlob, 'ticket.jpg');
        formData.append('data', JSON.stringify(payload));
        
        console.log('📤 Sending multipart request to /with-image');
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/with-image`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        console.log('📊 Response status:', response.status);

        const result = await response.json();
        console.log('✅ Response data:', result);

        if (!response.ok) {
          const errorMsg = result.error || result.message || `HTTP ${response.status}`;
          throw new Error(errorMsg);
        }

        const traceNo = result.data?.trace_no || payload.trace_no;
        setSaveStatus({
          type: 'success',
          message: `✓ Ticket saved successfully (Trace: ${traceNo})`,
        });
      } else {
        console.log('⚠️ No image available, saving ticket data only...');
        await createTicket(payload);
        
        setSaveStatus({
          type: 'success',
          message: `✓ Ticket saved successfully (Trace: ${payload.trace_no})`,
        });
      }
    } catch (error) {
      console.error('❌ Full error object:', error);
      
      let errorMessage = 'Failed to save ticket';
      let isTraceNoMissing = false;
      
      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();
        if (errorStr.includes('duplicate key') && (errorStr.includes('tickets_trace_no_key') || errorStr.includes('tickets_reference_no_key'))) {
          errorMessage = 'Ticket already saved';
        } else if (errorStr.includes('null value in column "trace_no"') || errorStr.includes('violates not-null constraint')) {
          errorMessage = 'Ticket ID or Reference No missing - Please scan again';
          isTraceNoMissing = true;
        } else {
          errorMessage = error.message;
        }
      }
      
      setSaveStatus({ type: 'error', message: `✗ ${errorMessage}`, isTraceNoMissing });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save ticket if it has <= 2 missing fields (more lenient than before)
  useEffect(() => {
    if (isOpen && data && !autoSaveCompleted && missingFieldCount <= 2) {
      handleSaveTicket();
      setAutoSaveCompleted(true);
    }
  }, [isOpen, data, autoSaveCompleted, missingFieldCount]);

  // Reset auto-save state when modal closes or new data arrives
  useEffect(() => {
    if (!isOpen) {
      setAutoSaveCompleted(false);
      setSaveStatus({ type: null, message: '' });
    }
  }, [isOpen]);

  // Early returns after all hooks
  if (!isOpen) return null;
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-gray-900"></div>
      <div className="relative h-full flex flex-col">
        {/* Data Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium">Ticket Preview</h2>
            {hasTooManyMissing && (
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
              >
                {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bill Template Content */}
        <div className="flex-1 overflow-hidden p-4 flex justify-center">
          {hasTooManyMissing ? (
            // Show error state when too many fields are missing
            <div className="bg-white text-black w-full max-w-sm rounded-lg shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8">
              <div className="text-center">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Data Quality Issue</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {missingFieldCount} critical fields are missing or unclear. Please recapture the ticket for better accuracy.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-gray-700">
                  <p className="font-semibold mb-2">Missing Fields:</p>
                  <ul className="space-y-1">
                    {criticalFields
                      .filter(field => {
                        const value = data[field as keyof TicketData];
                        return !value || value === 'RESCAN NEEDED' || value === '--';
                      })
                      .map(field => (
                        <li key={field}>• {field}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            // Show normal bill template when data is complete
            <div
              className="bg-white text-black w-full max-w-sm rounded-lg shadow-2xl overflow-hidden flex flex-col"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
            {/* Header with Logo */}
            <div className="text-center pt-4 pb-2 px-4 flex-shrink-0">
              <div className="w-16 h-16 mx-auto mb-2 border-2 border-gray-400 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-700" viewBox="0 0 64 64" fill="currentColor">
                  <path d="M32 8L12 24v4h4v24h32V28h4v-4L32 8zm0 6l12 10v22H20V24l12-10zm-4 14h8v12h-8V28z" />
                  <path d="M28 12h8v4h-8zM24 6h16v4H24z" />
                </svg>
              </div>
              <h1 className="text-base font-bold tracking-wide">SRI DALADA MALIGAWA</h1>
              <div className="text-[10px] mt-1 text-gray-600 leading-tight">
                <p className="font-semibold">TEMPLE OF THE TOOTH RELIC</p>
                <p>KANDY, SRI LANKA</p>
                <p className="text-blue-600">TEL : +94812234226</p>
                <p>EMAIL : info@sridaladamaligawa.lk</p>
                <p>WEB : www.sridaladamaligawa.lk</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-400 mx-4 flex-shrink-0"></div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-3 py-2 text-[11px]">
              {/* Main Info Section */}
              <div className="grid grid-cols-2 gap-y-1 mb-1">
                <div>
                  <span className="text-gray-500">DATE</span> :
                  <span className="font-semibold ml-1">{formatDate(formatValue(data['DATE']))}</span>
                </div>
                <div>
                  <span className="text-gray-500">TIME</span> :
                  <span className="font-semibold ml-1">{formatValue(data['TIME'])}</span>
                </div>
                <div>
                  <span className="text-gray-500">TERMINAL ID</span> :
                  <span className="font-semibold ml-1">{formatValue(data['TERMINAL ID'])}</span>
                </div>
                <div>
                  <span className="text-gray-500">LOCATION</span> :
                  <span className="font-semibold ml-1">{formatValue(data['LOCATION'])}</span>
                </div>
              </div>
              <div className="mb-1">
                <span className="text-gray-500">NO. TICKETS</span> :
                <span className="font-semibold ml-1">{formatValue(data['NO. TICKETS'])}</span>
              </div>

              {/* Amount Row */}
              <div className="flex justify-between items-center py-1 border-t border-b border-gray-300 mb-1">
                <span className="text-gray-500">TOTAL AMOUNT:</span>
                <span className="font-bold">{totalAmount}</span>
              </div>

              {/* Additional Fields */}
              <div className="space-y-0 mb-1">
                {Object.entries(data)
                  .filter(([key]) => !['DATE', 'TIME', 'TERMINAL ID', 'LOCATION', 'NO. TICKETS', 'TOTAL AMOUNT', 'BALANCE'].includes(key))
                  .map(([key, value]) => {
                    if (key === 'TRACE NO' || key === 'TRACE NO.') {
                      return (
                        <div key={key} className="flex justify-between gap-1">
                          <span className="text-gray-600">TRACE NO:</span>
                          <span className="font-semibold text-right break-all">{extractTraceNo(value)}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="flex justify-between gap-1">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-semibold text-right break-all">{formatValue(value)}</span>
                      </div>
                    );
                  })}
              </div>

              {/* Deposit Info */}
              <div className="border-t border-b border-gray-300 py-1 mb-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">TOTAL DEP</span>
                  <span>LKR</span>
                  <span className="font-semibold">{amountNum}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">BALANCE</span>
                  <span>LKR</span>
                  <span className="font-semibold">{extractBalance((data as any)['BALANCE'] || '0.00')}</span>
                </div>
              </div>

              {/* Ticket Type */}
              <div className="px-2 py-2 text-center mb-1">
                <p className="font-bold text-[10px] border border-gray-400 py-1 rounded">
                  ENTRANCE TICKET FOR FOREIGNERS - ONE PERSON ONLY
                </p>
              </div>

              {/* Summary Table */}
              <div className="px-2 pb-2">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-0 text-gray-500 font-normal">AMOUNT P/P</th>
                      <th className="text-center py-0 text-gray-500 font-normal">#TKT</th>
                      <th className="text-right py-0 text-gray-500 font-normal">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-0 font-semibold">{amountPerPerson} LKR</td>
                      <td className="text-center py-0 font-semibold">{ticketCount.toString().padStart(2, '0')}</td>
                      <td className="text-right py-0 font-semibold">{amountNum} LKR</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Data Modal Actions */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex gap-3 flex-col">
          {/* Status Message */}
          {saveStatus.type && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                saveStatus.type === 'success'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {saveStatus.message}
            </div>
          )}

          <div className="flex gap-3">
            {saveStatus.type === 'error' && saveStatus.isTraceNoMissing ? (
              // Show Scan Again button for missing trace_no
              <button
                onClick={() => {
                  onClose();
                  router.push('/scanner');
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Scan Again
              </button>
            ) : autoSaveCompleted && saveStatus.type === 'success' ? (
              // Show Done button after successful auto-save
              <button
                onClick={() => {
                  onClose();
                  router.push('/scanner');
                }}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Done
              </button>
            ) : autoSaveCompleted && saveStatus.type === 'error' && saveStatus.message.includes('already saved') ? (
              // Show Scan Again button when ticket already saved
              <button
                onClick={() => {
                  onClose();
                  router.push('/scanner');
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Scan Ticket
              </button>
            ) : hasTooManyMissing ? (
              // Show recapture message when too many fields missing
              <button
                onClick={() => {
                  onClose();
                  router.push('/scanner');
                }}
                title="Recapture the ticket - too many missing fields"
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recapture Required
              </button>
            ) : isSaving ? (
              // Show saving state
              <button
                disabled={true}
                className="flex-1 py-3 bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
