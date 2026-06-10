/**
 * Sanitization utilities for AI prompts.
 * Prevents prompt injection and strips sensitive data.
 * Per security.md and ai-plan-generator skill.
 */

export const sanitizeForPrompt = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '')          // Strip HTML tags
    .replace(/[`${}\\]/g, '')         // Strip template injection characters
    .replace(/system prompt|ignore previous instructions|you are a/gi, '[REDACTED]') // Basic injection mitigation
    .substring(0, 500)                // Hard cap length
    .trim();
};

/**
 * Strips PII from text before logging or processing.
 */
export const stripPII = (text: string): string => {
  if (!text) return '';
  
  // Simple patterns for demonstration; in production, use more robust PII detection
  return text
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi, '[EMAIL]')
    .replace(/\b\d{10,15}\b/g, '[PHONE]');
};
