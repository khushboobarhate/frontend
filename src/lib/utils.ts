import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string for display */
export function formatDate(dateStr: string, locale: string = 'en-IN'): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Format a date string with time */
export function formatDateTime(dateStr: string, locale: string = 'en-IN'): string {
  try {
    return new Date(dateStr).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/** Format currency in INR */
export function formatCurrency(amount: number, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Get the full photo URL from a relative path */
export function getPhotoUrl(photoPath: string | null): string | null {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  // Backend serves uploads at /uploads
  if (photoPath.startsWith('/')) return `${baseUrl}${photoPath}`;
  return `${baseUrl}/uploads/${photoPath}`;
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Map locale code to display name */
export function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    en: 'English',
    hi: 'हिन्दी (Hindi)',
    gu: 'ગુજરાતી (Gujarati)',
    mr: 'मराठी (Marathi)',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)',
    kn: 'ಕನ್ನಡ (Kannada)',
    bn: 'বাংলা (Bengali)',
    pa: 'ਪੰਜਾਬੀ (Punjabi)',
    ml: 'മലയാളം (Malayalam)',
    or: 'ଓଡ଼ିଆ (Odia)',
    ur: 'اردو (Urdu)',
    as: 'অসমীয়া (Assamese)',
  };
  return map[code] || code;
}

/** Get role display label */
export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Admin',
    farmer: 'Farmer',
    buyer: 'Buyer',
  };
  return map[role] || role;
}

/** Sanitize phone number — ensure it starts with + */
export function sanitizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length >= 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
}
