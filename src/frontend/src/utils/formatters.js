/**
 * Utility functions for formatting data in the Quillium UI
 */

/**
 * Format a date string to a human-readable format
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Truncate a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated string
 */
export function truncateString(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  
  return `${str.substring(0, length)}...`;
}

/**
 * Format a number with commas as thousands separators
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Convert markdown to plain text
 * @param {string} markdown - Markdown string
 * @returns {string} - Plain text
 */
export function markdownToPlainText(markdown) {
  if (!markdown) return '';
  
  return markdown
    .replace(/#{1,6}\s?([^\n]+)/g, '$1') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
    .trim();
}

export default {
  formatDate,
  truncateString,
  formatNumber,
  markdownToPlainText,
};
