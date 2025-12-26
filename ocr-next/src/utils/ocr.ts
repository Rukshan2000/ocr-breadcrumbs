// Image preprocessing function
export function preprocessImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrast = 1.5;
    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
    let enhanced = factor * (gray - 128) + 128;
    const binarized = enhanced > 128 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binarized;
  }
  return imageData;
}

// Dalada Maligawa ticket text correction
export function correctTicketText(text: string): string {
  const corrections: [RegExp, string][] = [
    // Field names - common OCR mistakes
    [/\bDAT[E3]\b/gi, 'DATE'],
    [/\bT[1I!l]N[E3]\b/gi, 'TIME'],
    [/\bT[1I!l]M[E3]\b/gi, 'TIME'],
    [/\bTIME?\b/gi, 'TIME'],
    [/\bT[E3]RM[1I!l]NAL\s*[\[\(]?[1I!l]?[D0O]\]?\b/gi, 'TERMINAL ID'],
    [/\bTERMINAL\s*[\[\(\{]?[1I!liD0O]+[\]\)\}]?\s*:/gi, 'TERMINAL ID :'],
    [/\bL[O0]CAT[1I!l][O0]N\b/gi, 'LOCATION'],
    [/\bN[O0][.,]?\s*T[1I!l]CK[E3]TS?\b/gi, 'NO. TICKETS'],
    [/\bT[O0]TAL\s*AM[O0]UNT\b/gi, 'TOTAL AMOUNT'],
    [/\bTRAC[E3]\s*N[O0]\b/gi, 'TRACE NO'],
    [/\bR[E3]F+[E3]R+[E3]NC[E3]\s*N[O0]\b/gi, 'REFFERENCE NO'],
    [/\bR[E3]F[.,]?\s*N[O0]\b/gi, 'REFFERENCE NO'],
    [/\bT[1I!l]CK[E3]T\s*AM[O0]UNT\s*P\/?P\b/gi, 'TICKET AMOUNT P/P'],
    [/[#H]\s*T[1I!l]CK[E3]TS?\b/gi, '#TICKETS'],

    // Location values
    [/\bMa[1I!l]n\s*[E3]ntranc[e3]\b/gi, 'Main Entrance'],

    // Temple name corrections
    [/\bSR[1I!l]\s*DALADA\s*MAL[1I!l]?GAWA\b/gi, 'SRI DALADA MALIGAWA'],
    [/\bDALADA\s*MAL[1I!l]?GAWA\b/gi, 'DALADA MALIGAWA'],
    [/\bT[E3]MPL[E3]\s*[O0]F\s*TH[E3]\s*T[O0]{2}TH\s*R[E3]L[1I!l]C\b/gi, 'TEMPLE OF THE TOOTH RELIC'],

    // Common words
    [/\bKANDY\b/gi, 'KANDY'],
    [/\bSR[1I!l]\s*LANKA\b/gi, 'SRI LANKA'],
    [/\bF[O0]R[E3][1I!l]GN[E3]RS\b/gi, 'FOREIGNERS'],
    [/\bP[E3]RS[O0]N\b/gi, 'PERSON'],
    [/\b[O0]NLY\b/gi, 'ONLY'],
    [/\b[E3]NTRANC[E3]\b/gi, 'ENTRANCE'],
    [/\bT[1I!l]CK[E3]T\b/gi, 'TICKET'],
    [/\bBALANC[E3]\b/gi, 'BALANCE'],
    [/\bT[O0]TAL\s*D[E3]P\b/gi, 'TOTAL DEP'],

    // Fix common number substitutions in field context
    [/\b[O0]1\b/g, '01'],
    [/\bLKR\b/gi, 'LKR'],
    [/\bHRS\b/gi, 'HRS'],

    // Clean up artifacts
    [/@ent/gi, ''],
    [/\(\?\}[0-9]*\s*['"]?\s*A\s*tbl%/gi, ''],
    [/<"\/£'>~,,\s*\d*/gi, ''],
    [/%\s*EE&\s*\d*/gi, ''],
    [/<\s*ARX\s*=\s*i/gi, ''],
    [/Y,\s*=/gi, ''],
    [/T\s*mancrtt/gi, ''],
    [/\[=\];?/g, ''],
    [/\[\s*\|\s*\]/g, ''],
  ];

  let corrected = text;
  for (const [pattern, replacement] of corrections) {
    corrected = corrected.replace(pattern, replacement);
  }

  // Clean up multiple spaces and blank lines
  corrected = corrected.replace(/[ \t]+/g, ' ');
  corrected = corrected.replace(/\n\s*\n\s*\n/g, '\n\n');

  return corrected.trim();
}

export interface TicketData {
  DATE: string;
  TIME: string;
  'TERMINAL ID': string;
  LOCATION: string;
  'NO. TICKETS': string;
  'TOTAL AMOUNT': string;
  'TRACE NO': string;
  'REFFERENCE NO': string;
}

// Extract ticket data from OCR text
export function extractTicketData(text: string): TicketData {
  const data: TicketData = {
    DATE: '',
    TIME: '',
    'TERMINAL ID': '',
    LOCATION: '',
    'NO. TICKETS': '',
    'TOTAL AMOUNT': '',
    'TRACE NO': '',
    'REFFERENCE NO': '',
  };

  // Extract DATE
  const dateMatch = text.match(/DATE\s*[:\s'"\`]+\s*(\d{1,2}[-\/][A-Z]{3}[-\/]\d{4})/i);
  if (dateMatch) {
    data['DATE'] = dateMatch[1];
  }

  // Extract TIME
  let timeMatch = text.match(/T[I1!l]M?N?E\s*[:\s"'\`]*\s*([\d]{1,2})[:\.\s]([\d]{2})\s*HRS?/i);
  if (timeMatch) {
    data['TIME'] = timeMatch[1].padStart(2, '0') + ':' + timeMatch[2] + ' HRS';
  } else {
    const timeMatch2 = text.match(/T[I1!l]M?N?E\s*[:\s"'\`]*\s*([\d]{2})([\d]{2})\s*HRS?/i);
    if (timeMatch2) {
      let hours = parseInt(timeMatch2[1]);
      data['TIME'] = hours.toString().padStart(2, '0') + ':' + timeMatch2[2] + ' HRS';
    }
  }

  // Extract TERMINAL ID
  let terminalMatch = text.match(/TERMINAL\s*[\[\(\{]?[I1!lD]*[\]\)\}]?\s*[:\s]+[:\s']*(T[\dOoQqCc]{3,5})/i);
  if (!terminalMatch) {
    terminalMatch = text.match(/TERMINAL[^T]{0,15}(T[0OoQqCc\d]{3,5})/i);
  }
  if (!terminalMatch) {
    terminalMatch = text.match(/:(T[0OoQqCc\d]{3,5})\b/i);
  }

  if (terminalMatch) {
    let terminalId = terminalMatch[1].toUpperCase().replace(/[OQC]/gi, '0');
    const digits = terminalId.substring(1);
    const cleanDigits = digits.slice(-4).padStart(4, '0');
    terminalId = 'T' + cleanDigits;
    if (/^T\d{3,4}$/.test(terminalId)) {
      data['TERMINAL ID'] = terminalId;
    } else {
      data['TERMINAL ID'] = 'RESCAN NEEDED';
    }
  } else {
    data['TERMINAL ID'] = 'RESCAN NEEDED';
  }

  // Extract LOCATION
  const locationMatch = text.match(/LOCATION\s*[:\s]+[:\s]*([A-Za-z\s]+?)(?=\n|NO\.|$)/i);
  if (locationMatch) data['LOCATION'] = locationMatch[1].trim();

  // Extract NO. TICKETS
  let ticketsMatch = text.match(/NO\.?\s*TICKETS?\s*[:\s'"\`]*[:\s'"]*([OoQq\d]+)/i);
  if (ticketsMatch) {
    let tickets = ticketsMatch[1].replace(/[OoQq]/g, '0');
    tickets = tickets.replace(/^0+/, '') || '0';
    data['NO. TICKETS'] = tickets.padStart(2, '0');
  }

  // Extract TOTAL AMOUNT
  let totalMatch = text.match(/TOTAL\s*AMOUNT\s*[:\s]+[:\s]*(?:LKR\s*)?([\d][,\.\d\s]*[\d]{2})/i);
  if (totalMatch) {
    let amount = totalMatch[1].replace(/\s+/g, '');
    const parts = amount.split(/[,\.]/);
    if (parts.length >= 2) {
      const lastPart = parts.pop();
      const wholePart = parts.join(',');
      amount = wholePart + '.' + lastPart;
    }
    data['TOTAL AMOUNT'] = 'LKR ' + amount;
  } else {
    const totalMatch2 = text.match(/TOTAL\s*AMOUNT[^\d]*(\d[,\.\d\s]+)/i);
    if (totalMatch2) {
      let amount = totalMatch2[1].replace(/\s+/g, '').replace(/,+$/, '').replace(/\.+$/, '');
      data['TOTAL AMOUNT'] = 'LKR ' + amount;
    }
  }

  // Extract TRACE NO
  const traceMatch = text.match(/TRACE\s*NO\s*[:\s'"\`]+[:\s']*(\d+)/i);
  if (traceMatch) data['TRACE NO'] = traceMatch[1];

  // Extract REFERENCE NO
  const refMatch = text.match(/REF+E?R+E?NCE?\s*NO\s*[:\s'"\`]+[:\s'"]*([A-Z0-9]+)/i);
  if (refMatch) data['REFFERENCE NO'] = refMatch[1];

  return data;
}
