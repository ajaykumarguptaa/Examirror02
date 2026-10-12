/**
 * Input validation and sanitization utilities
 * Enforces strict typing for numbers, phone, aadhaar, PAN, pincode, names, and email.
 */

// Allow only numbers and optionally enforce maximum length
export const onlyDigits = (val: string, maxLen?: number): string => {
  const digits = (val || '').replace(/\D/g, '');
  return maxLen !== undefined ? digits.slice(0, maxLen) : digits;
};

// Allow only alphabet characters, spaces, and dots for person names
export const onlyNameLetters = (val: string): string => {
  return (val || '').replace(/[^a-zA-Z\s.]/g, '');
};

// Format PAN card number: uppercase alphanumeric, max 10 chars
export const formatPAN = (val: string): string => {
  return (val || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
};

// Validates 10-digit Indian Mobile Number (starts with 6, 7, 8, 9)
export const isValidIndianPhone = (val: string): boolean => {
  return /^[6-9]\d{9}$/.test((val || '').trim());
};

// Validates 12-digit Indian Aadhaar Number
export const isValidAadhaar = (val: string): boolean => {
  return /^\d{12}$/.test((val || '').trim());
};

// Validates 10-character Indian PAN Number (5 letters, 4 digits, 1 letter)
export const isValidPAN = (val: string): boolean => {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test((val || '').trim().toUpperCase());
};

// Validates 6-digit Indian Postal Pincode
export const isValidPincode = (val: string): boolean => {
  return /^\d{6}$/.test((val || '').trim());
};

// Validates Email Format
export const isValidEmail = (val: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());
};
