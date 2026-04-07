/**
 * Simple XSS / HTML sanitization for user-generated text.
 * Strips HTML tags, escapes dangerous characters, and trims whitespace.
 */
export function sanitizeText(input: string): string {
  return input
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape dangerous characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Trim whitespace
    .trim();
}
