const ALLOWED_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const generateSegment = (length: number): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    result += ALLOWED_CHARS[randomIndex];
  }
  return result;
};

const generateChecksum = (input: string): string => {
  let sum = 0;
  
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i);
  }
  
  const checksumIndex = sum % ALLOWED_CHARS.length;
  return ALLOWED_CHARS[checksumIndex];
};

export const generateTrackingCode = (orderId?: number | string): string => {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-6);
  
  const timeComponent = parseInt(timestamp).toString(36).toUpperCase();
  
  const orderComponent = orderId 
    ? parseInt(orderId.toString()).toString(36).toUpperCase().padStart(4, '0').slice(-4)
    : generateSegment(4);
  
  const randomSegment1 = generateSegment(4);
  const randomSegment2 = generateSegment(4);
  
  const codeWithoutChecksum = `${orderComponent}${randomSegment1}${randomSegment2}${timeComponent}`;
  
  const checksum = generateChecksum(codeWithoutChecksum);
  
  return `TRK-${orderComponent}-${randomSegment1}-${randomSegment2}-${checksum}`;
};

export const validateTrackingCode = (code: string): boolean => {
  const regex = /^TRK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]$/;
  if (!regex.test(code)) {
    return false;
  }
  
  const parts = code.split('-');
  const codeWithoutChecksum = parts[1] + parts[2] + parts[3];
  const providedChecksum = parts[4];
  
  const calculatedChecksum = generateChecksum(codeWithoutChecksum);
  
  return providedChecksum === calculatedChecksum;
};

export const formatTrackingCode = (code: string): string => {
  const clean = code.replace(/-/g, '');
  
  if (clean.length !== 13) {
    return code;
  }
  
  return `TRK-${clean.substring(0, 4)}-${clean.substring(4, 8)}-${clean.substring(8, 12)}-${clean.substring(12)}`;
};

/**
 * Determines if a tracking code should be locked (immutable)
 * Once a tracking code is set for an order and communicated to customers,
 * it should never change to ensure consistency
 * 
 * @param trackingCode - The existing tracking code if any
 * @returns Boolean indicating if the tracking code should be locked
 */
export const shouldLockTrackingCode = (trackingCode?: string | null): boolean => {
  // If there's a valid tracking code already, it should be locked
  return !!trackingCode && trackingCode.trim() !== '';
};
