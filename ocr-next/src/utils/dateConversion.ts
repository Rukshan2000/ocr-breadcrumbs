/**
 * Convert UTC datetime to IST (UTC+5:30)
 * @param utcDateTime - UTC datetime string (e.g., "2026-01-06T07:17:48.000Z")
 * @returns IST datetime string in the same format
 */
export function convertUTCToIST(utcDateTime: string): string {
  try {
    const utcDate = new Date(utcDateTime);
    
    // IST offset is UTC+5:30 (5 hours 30 minutes)
    const istOffset = 5.5 * 60 * 60 * 1000; // Convert to milliseconds
    
    // Add offset to UTC time to get IST time
    const istDate = new Date(utcDate.getTime() + istOffset);
    
    // Format as ISO string and replace Z with +05:30
    const isoString = istDate.toISOString();
    const istString = isoString.slice(0, -1) + '+05:30';
    
    return istString;
  } catch (error) {
    console.error('Failed to convert UTC to IST:', error);
    return utcDateTime; // Return original if conversion fails
  }
}

/**
 * Get IST datetime in ISO format
 * Useful for storing and comparing token expiry times
 */
export function getISTDateTime(): string {
  const utcDate = new Date();
  return convertUTCToIST(utcDate.toISOString());
}

/**
 * Check if token is expired (in IST)
 * @param expiryTimeIST - Token expiry time in IST format
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(expiryTimeIST: string): boolean {
  try {
    const expiryDate = new Date(expiryTimeIST);
    const currentTimeIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    
    return currentTimeIST >= expiryDate;
  } catch (error) {
    console.error('Failed to check token expiry:', error);
    return true; // Consider as expired if cannot determine
  }
}

/**
 * Get remaining time until token expiry in seconds
 * @param expiryTimeIST - Token expiry time in IST format
 * @returns Remaining time in seconds
 */
export function getTokenExpiryInSeconds(expiryTimeIST: string): number {
  try {
    const expiryDate = new Date(expiryTimeIST);
    const currentTimeIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    
    const remainingMs = expiryDate.getTime() - currentTimeIST.getTime();
    return Math.max(0, Math.floor(remainingMs / 1000));
  } catch (error) {
    console.error('Failed to get token expiry time:', error);
    return 0;
  }
}
