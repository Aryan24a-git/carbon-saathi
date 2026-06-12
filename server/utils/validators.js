/**
 * @fileoverview Centralized validators and HTML sanitizers for CarbonSaathi AI inputs.
 * @module server/utils/validators
 */

const { z } = require('zod');
const { VALID_CATEGORIES, MAX_MESSAGE_LENGTH, BASELINE_FACTORS } = require('./constants');

/**
 * Strips HTML tags from a string.
 */
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Validates if input is a valid string.
 */
function isValidString(val, minLen, maxLen) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.length >= minLen && trimmed.length <= maxLen;
}

/**
 * Sanitizes input string to prevent HTML/XSS injection.
 */
function sanitizeHtml(val) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

const activitySchema = z.object({
  category: z.string().refine(val => VALID_CATEGORIES.includes(val), { message: "Invalid category" }),
  activityType: z.string().min(1).transform(stripHtml),
  value: z.number().positive()
});

const onboardingSchema = z.object({
  commute: z.enum(Object.keys(BASELINE_FACTORS.commute)),
  diet: z.enum(Object.keys(BASELINE_FACTORS.diet)),
  acUsage: z.enum(Object.keys(BASELINE_FACTORS.acUsage)),
  recycling: z.boolean(),
  onlineShopping: z.enum(['rarely', 'weekly', 'daily'])
});

const messageSchema = z.string().min(1).max(MAX_MESSAGE_LENGTH).transform(stripHtml);

/**
 * Validates carbon activity entry.
 */
function validateActivity(body) {
  if (!body) return { valid: false, error: 'Activity body is missing' };
  try {
    const sanitized = activitySchema.parse(body);
    return { valid: true, sanitized };
  } catch (err) {
    return { valid: false, error: err.issues[0].message };
  }
}

/**
 * Validates onboarding payload.
 */
function validateOnboarding(body) {
  if (!body) return { valid: false, error: 'Onboarding body is missing' };
  try {
    const profile = onboardingSchema.parse(body);
    return { valid: true, profile };
  } catch (err) {
    return { valid: false, error: err.issues[0].message };
  }
}

/**
 * Validates general messages.
 */
function validateMessage(message) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return { valid: false, error: 'Message must be a non-empty string' };
  }
  try {
    const parsed = messageSchema.parse(message);
    return { valid: true, message: parsed };
  } catch (err) {
    return { valid: false, error: err.issues[0].message };
  }
}

module.exports = {
  stripHtml,
  isValidString,
  sanitizeHtml,
  validateActivity,
  validateOnboarding,
  validateMessage,
  activitySchema,
  onboardingSchema,
  messageSchema
};
