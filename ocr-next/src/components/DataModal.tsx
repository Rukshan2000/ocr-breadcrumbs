import { TicketData } from '@/utils/ocr';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TicketData | null;
}

export default function DataModal({ isOpen, onClose, data }: DataModalProps) {
  if (!isOpen || !data) return null;

  const formatValue = (value: string, placeholder = '--') => {
    if (!value || value === 'RESCAN NEEDED') return placeholder;
    return value;
  };

  const extractAmount = (amountStr: string) => {
    if (!amountStr) return '0.00';
    const match = amountStr.match(/([\d,\.]+)/);
    return match ? match[1] : '0.00';
  };

  const totalAmount = formatValue(data['TOTAL AMOUNT'], 'LKR 0.00');
  const amountNum = extractAmount(totalAmount);
  const ticketCount = parseInt(data['NO. TICKETS']) || 1;
  const totalAmountNum = parseFloat(amountNum.replace(/,/g, '')) || 0;
  const amountPerPerson = ticketCount > 0 ? (totalAmountNum / ticketCount).toFixed(2) : '0.00';

  const handleCopyData = async () => {
    const dataText = Object.entries(data)
      .map(([key, value]) => `${key}: ${value || 'N/A'}`)
      .join('\n');
    await navigator.clipboard.writeText(dataText);
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-gray-900"></div>
      <div className="relative h-full flex flex-col">
        {/* Data Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-lg font-medium">Ticket Preview</h2>
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
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div
            className="bg-white text-black w-full max-w-sm rounded-lg shadow-2xl overflow-hidden"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {/* Header with Logo */}
            <div className="text-center pt-6 pb-4 px-4">
              <div className="w-20 h-20 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-700" viewBox="0 0 64 64" fill="currentColor">
                  <path d="M32 8L12 24v4h4v24h32V28h4v-4L32 8zm0 6l12 10v22H20V24l12-10zm-4 14h8v12h-8V28z" />
                  <path d="M28 12h8v4h-8zM24 6h16v4H24z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold tracking-wide">SRI DALADA MALIGAWA</h1>
              <div className="text-xs mt-1 text-gray-600 leading-relaxed">
                <p className="font-semibold">TEMPLE OF THE TOOTH RELIC</p>
                <p>KANDY, SRI LANKA</p>
                <p className="text-blue-600">TEL : +94812234226</p>
                <p>EMAIL : info@sridaladamaligawa.lk</p>
                <p>WEB : www.sridaladamaligawa.lk</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-400 mx-4"></div>

            {/* Main Info Section */}
            <div className="px-4 py-3 text-xs">
              <div className="grid grid-cols-2 gap-y-1">
                <div>
                  <span className="text-gray-500">DATE</span> :
                  <span className="font-semibold ml-1">{formatValue(data['DATE'])}</span>
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
              <div className="mt-2">
                <span className="text-gray-500">NO. TICKETS</span> :
                <span className="font-semibold ml-1">{formatValue(data['NO. TICKETS'])}</span>
              </div>

              {/* Amount Row */}
              <div className="flex justify-between items-center mt-2 py-2 border-t border-b border-gray-300">
                <span className="text-gray-500">TOTAL AMOUNT:</span>
                <span className="font-bold text-base">{totalAmount}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-400 mx-4"></div>

            {/* Deposit Info */}
            <div className="px-4 py-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">TOTAL DEP</span>
                <span>LKR</span>
                <span className="font-semibold">{amountNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BALANCE</span>
                <span>LKR</span>
                <span className="font-semibold">0.00</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-400 mx-4"></div>

            {/* Trace & Reference */}
            <div className="px-4 py-2 text-xs">
              <div className="mb-1">
                <span className="text-gray-500">TRACE NO</span>
                <span className="ml-2">:</span>
                <span className="font-mono ml-1">{formatValue(data['TRACE NO'])}</span>
              </div>
              <div className="break-all">
                <span className="text-gray-500">REFERENCE NO</span>:
                <span className="font-mono text-[10px] ml-1">{formatValue(data['REFFERENCE NO'])}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-400 mx-4"></div>

            {/* Ticket Type */}
            <div className="px-4 py-3 text-center">
              <p className="font-bold text-sm border border-gray-400 py-2 rounded">
                ENTRANCE TICKET FOR FOREIGNERS - ONE PERSON ONLY
              </p>
            </div>

            {/* Summary Table */}
            <div className="px-4 pb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1 text-gray-500 font-normal">TICKET AMOUNT P/P</th>
                    <th className="text-center py-1 text-gray-500 font-normal">#TICKETS</th>
                    <th className="text-right py-1 text-gray-500 font-normal">TOTAL AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold">{amountPerPerson} LKR</td>
                    <td className="text-center py-1 font-semibold">{ticketCount.toString().padStart(2, '0')}</td>
                    <td className="text-right py-1 font-semibold">{amountNum} LKR</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* QR Code Placeholder */}
            <div className="px-4 pb-4 flex justify-between items-end">
              <div className="w-16 h-16 border-2 border-gray-400 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-3 0h1v1h-1v-1zm1 1h1v1h-1v-1zm-1 1h1v1h-1v-1zm2 0h1v1h-1v-1zm0 2h1v1h-1v-1zm-2 0h1v1h-1v-1zm3-3h1v1h-1v-1zm0 2h1v1h-1v-1z" />
                </svg>
              </div>
              <div className="w-16 h-16 border-2 border-gray-400 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-3 0h1v1h-1v-1zm1 1h1v1h-1v-1zm-1 1h1v1h-1v-1zm2 0h1v1h-1v-1zm0 2h1v1h-1v-1zm-2 0h1v1h-1v-1zm3-3h1v1h-1v-1zm0 2h1v1h-1v-1z" />
                </svg>
              </div>
            </div>

            {/* Page Number */}
            <div className="text-right px-4 pb-2 text-xs text-gray-400">01/01</div>
          </div>
        </div>

        {/* Data Modal Actions */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex gap-3">
          <button
            onClick={handleCopyData}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
          >
            Copy Data
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
