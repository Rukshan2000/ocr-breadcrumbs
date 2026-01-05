/**
 * OCR Debugging Utilities
 * Helps diagnose OCR recognition and text extraction issues
 */

export interface DebugInfo {
  rawOcrText: string;
  cleanedText: string;
  extractedFields: Record<string, string>;
  fieldMatchDetails: Record<string, { pattern: string; matched: boolean; result: string }>;
  confidenceScore: number;
  imageStats: {
    width: number;
    height: number;
    size: string;
  };
  processingTime: number;
}

/**
 * Log OCR results for debugging
 */
export function logOcrDebug(info: DebugInfo): void {
  console.group('🔍 OCR Debug Information');
  
  console.log('📊 Image Stats:', info.imageStats);
  console.log('⏱️ Processing Time:', `${info.processingTime}ms`);
  console.log('📈 Confidence Score:', `${info.confidenceScore.toFixed(2)}%`);
  
  console.group('📝 Raw OCR Text');
  console.log(info.rawOcrText);
  console.groupEnd();
  
  console.group('✏️ Cleaned Text');
  console.log(info.cleanedText);
  console.groupEnd();
  
  console.group('🎯 Extracted Fields');
  Object.entries(info.extractedFields).forEach(([field, value]) => {
    const status = value && value !== 'RESCAN NEEDED' ? '✓' : '✗';
    console.log(`${status} ${field}:`, value || '(empty)');
  });
  console.groupEnd();
  
  console.group('🔎 Pattern Matching Details');
  Object.entries(info.fieldMatchDetails).forEach(([field, detail]) => {
    const status = detail.matched ? '✓' : '✗';
    console.log(`${status} ${field}:`, {
      pattern: detail.pattern,
      matched: detail.matched,
      result: detail.result || '(no match)',
    });
  });
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Analyze OCR text and provide suggestions for improvement
 */
export function analyzeOcrQuality(rawText: string, confidence: number): {
  issues: string[];
  suggestions: string[];
  score: number;
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check confidence score
  if (confidence < 50) {
    issues.push('Very low confidence score');
    suggestions.push('Improve lighting conditions');
    suggestions.push('Ensure text is clearly visible');
    score -= 40;
  } else if (confidence < 70) {
    issues.push('Low confidence score');
    suggestions.push('Try better lighting');
    score -= 20;
  }

  // Check if text is readable
  if (rawText.length === 0) {
    issues.push('No text detected in image');
    suggestions.push('Ensure ticket is in focus');
    suggestions.push('Check that text is visible');
    score -= 50;
  } else if (rawText.length < 50) {
    issues.push('Very little text detected');
    suggestions.push('Ensure complete ticket is visible');
    score -= 30;
  }

  // Check for common OCR artifacts
  if (rawText.match(/[!@#$%^&*()_+=\[\]{};:'",.<>?/`~\\]/g)?.length || 0 > 10) {
    issues.push('High number of special characters (likely OCR errors)');
    suggestions.push('Improve image clarity');
    suggestions.push('Ensure text is not blurry');
    score -= 15;
  }

  // Check if text is mostly garbled
  const wordsPerLine = rawText
    .split('\n')
    .map(line => line.split(/\s+/).filter(w => w.length > 2).length)
    .reduce((a, b) => a + b, 0);

  if (wordsPerLine < 5) {
    issues.push('Text appears garbled or unclear');
    suggestions.push('Retake the photo with better focus');
    suggestions.push('Ensure adequate lighting');
    score -= 20;
  }

  // Check for key field keywords
  const hasKeywords = /DATE|TIME|TERMINAL|LOCATION|TICKET|AMOUNT|TOTAL/i.test(rawText);
  if (!hasKeywords) {
    issues.push('Key field labels not detected');
    suggestions.push('Ensure ticket contains expected fields');
    score -= 25;
  }

  return {
    issues: issues.length > 0 ? issues : ['Text recognized successfully'],
    suggestions: suggestions.length > 0 ? suggestions : ['Image quality is good'],
    score: Math.max(0, score),
  };
}

/**
 * Compare expected fields with extracted data
 */
export function validateExtractedData(data: Record<string, string>): {
  complete: string[];
  incomplete: string[];
  missing: string[];
} {
  const expectedFields = ['DATE', 'TIME', 'TERMINAL ID', 'LOCATION', 'NO. TICKETS', 'TOTAL AMOUNT', 'TRACE NO', 'REFFERENCE NO'];

  const complete: string[] = [];
  const incomplete: string[] = [];
  const missing: string[] = [];

  expectedFields.forEach(field => {
    const value = data[field];
    if (!value || value === 'RESCAN NEEDED') {
      missing.push(field);
    } else if (value === '--' || value.length === 0) {
      incomplete.push(field);
    } else {
      complete.push(field);
    }
  });

  return { complete, incomplete, missing };
}

/**
 * Format debug output for display in UI
 */
export function formatDebugDisplay(info: DebugInfo): string {
  const lines: string[] = [];

  lines.push('=== OCR Debug Info ===');
  lines.push(`Confidence: ${info.confidenceScore.toFixed(2)}%`);
  lines.push(`Processing: ${info.processingTime}ms`);
  lines.push(`Image: ${info.imageStats.width}x${info.imageStats.height} (${info.imageStats.size})`);
  lines.push('');

  lines.push('=== Extracted Fields ===');
  Object.entries(info.extractedFields).forEach(([field, value]) => {
    const status = value && value !== 'RESCAN NEEDED' ? '✓' : '✗';
    lines.push(`${status} ${field}: ${value || '(empty)'}`);
  });
  lines.push('');

  lines.push('=== Raw Text ===');
  lines.push(info.rawOcrText.substring(0, 200) + (info.rawOcrText.length > 200 ? '...' : ''));

  return lines.join('\n');
}

/**
 * Extract pattern details for a specific field
 */
export function getFieldPattern(field: string): {
  name: string;
  patterns: RegExp[];
  description: string;
} {
  const patterns: Record<string, { patterns: RegExp[]; description: string }> = {
    'DATE': {
      patterns: [
        /DATE\s*[:\s'"\`]+\s*(\d{1,2}[-\/][A-Z]{3}[-\/]\d{4})/i,
        /\b(\d{1,2}[-\/][A-Z]{3}[-\/]\d{4})\b/,
      ],
      description: 'Date in format: DD-MMM-YYYY (e.g., 29-DEC-2024)',
    },
    'TIME': {
      patterns: [
        /T[I1!l]M?N?E\s*[:\s"'\`]*\s*([\d]{1,2})[:\.\s]([\d]{2})\s*HRS?/i,
        /(\d{1,2}):(\d{2})\s*HRS?/i,
      ],
      description: 'Time in format: HH:MM HRS',
    },
    'TERMINAL ID': {
      patterns: [
        /TERMINAL\s*[\[\(\{]?[I1!lD]*[\]\)\}]?\s*[:\s]+[:\s']*(T[\dOoQqCc]{3,5})/i,
        /\b(T[0OoQqCc\d]{3,5})\b/,
      ],
      description: 'Terminal ID starting with T (e.g., T0001)',
    },
    'LOCATION': {
      patterns: [
        /LOCATION\s*[:\s]+[:\s]*([A-Za-z\s]+?)(?=\n|NO\.|$)/i,
      ],
      description: 'Location name (e.g., Main Entrance)',
    },
    'NO. TICKETS': {
      patterns: [
        /NO\.?\s*TICKETS?\s*[:\s'"\`]*[:\s'"]*([OoQq\d]+)/i,
        /TICKETS?\s*:?\s*(\d+)/i,
      ],
      description: 'Number of tickets',
    },
    'TOTAL AMOUNT': {
      patterns: [
        /TOTAL\s*A[UM]*OUNT\s*[:\s]+[:\s]*(?:LKR\s*)?([\d][,\.\d\s]*[\d])/i,
        /(?:LKR|LKR\s+)?([\d,\.]+\.\d{2})/i,
      ],
      description: 'Total amount (e.g., LKR 1500.00)',
    },
  };

  const pattern = patterns[field];
  if (!pattern) {
    return {
      name: field,
      patterns: [],
      description: 'Pattern not defined',
    };
  }

  return {
    name: field,
    patterns: pattern.patterns,
    description: pattern.description,
  };
}

/**
 * Test patterns against text
 */
export function testPatterns(field: string, text: string): {
  patterns: Array<{ pattern: string; matched: boolean; capture: string }>;
  found: boolean;
} {
  const fieldInfo = getFieldPattern(field);
  const results = fieldInfo.patterns.map(pattern => {
    const match = text.match(pattern);
    return {
      pattern: pattern.source,
      matched: !!match,
      capture: match ? match[1] || match[0] : '',
    };
  });

  return {
    patterns: results,
    found: results.some(r => r.matched),
  };
}
