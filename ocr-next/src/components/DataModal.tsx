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

  const extractBalance = (balanceStr: string) => {
    if (!balanceStr) return '0.00';
    const match = balanceStr.match(/([\d,\.]+)/);
    return match ? match[1] : '0.00';
  };

  const extractTraceNo = (traceStr: string) => {
    if (!traceStr) return '--';
    // Remove common prefixes like "TRACE NO." or "TRACE NO :" and clean up
    return traceStr.replace(/^TRACE\s+NO[\s\.:]*/, '').trim();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    // Match DD-Month-Year pattern (handle cases like 119 or 19)
    const dateMatch = dateStr.match(/(\d{1,3})-([A-Z]{3})-(\d{4})/i);
    if (dateMatch) {
      let day = parseInt(dateMatch[1]);
      const month = dateMatch[2];
      const year = dateMatch[3];
      
      // Fix invalid days (e.g., 119 -> 19)
      if (day > 31) {
        day = day % 100; // Extract last two digits
      }
      
      return `${day.toString().padStart(2, '0')}-${month.toUpperCase()}-${year}`;
    }
    return dateStr;
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
        <div className="flex-1 overflow-hidden p-4 flex justify-center">
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
                    // Special handling for TRACE NO
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
