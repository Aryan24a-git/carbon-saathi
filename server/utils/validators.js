/**
 * @fileoverview Centralized validators and HTML sanitizers for CarbonSaathi AI inputs.
 * @module server/utils/validators
 */

const { VALID_CATEGORIES, MAX_MESSAGE_LENGTH, BASELINE_FACTORS } = require('./constants');

/**
 * Strips HTML tags from a string.
 * @param {string} str - Input string.
 * @returns {string} Stripped string.
 * @throws {Error} Never throws.
 * @example
 * stripHtml('<p>test</p>');
 */
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Validates if input is a valid string.
 * @param {*} val - Value to check.
 * @param {number} minLen - Minimum length.
 * @param {number} maxLen - Maximum length.
 * @returns {boolean} True if valid.
 * @throws {Error} Never throws.
 * @example
 * isValidString('hello', 1, 10);
 */
function isValidString(val, minLen, maxLen) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.length >= minLen && trimmed.length <= maxLen;
}

/**
 * Sanitizes input string to prevent HTML/XSS injection.
 * @param {string} val - String to sanitize.
 * @returns {string} Sanitized string.
 * @throws {Error} Never throws.
 * @example
 * sanitizeHtml('<script>alert("xss")</script>');
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

/**
 * Validates carbon activity entry.
 * @param {Object} body - Request body containing activity fields.
 * @returns {Object} Validation result { valid, error, sanitized }
 * @throws {Error} Never throws.
 * @example
 * validateActivity({ category: 'travel', activityType: 'metro', value: 10 });
 */
function validateActivity(body) {
  if (!body) {
    return { valid: false, error: 'Activity body is missing' };
  }

  const { category, activityType, value } = body;

  if (!VALID_CATEGORIES.includes(category)) {
    return { valid: false, error: `Invalid category: ${category}` };
  }

  if (typeof activityType !== 'string' || activityType.trim() === '') {
    return { valid: false, error: 'activityType must be a non-empty string' };
  }

  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return { valid: false, error: 'value must be a positive number' };
  }

  return {
    valid: true,
    sanitized: {
      category: stripHtml(category),
      activityType: stripHtml(activityType),
      value
    }
  };
}

/**
 * Validates onboarding payload.
 * @param {Object} body - Request body containing onboarding profile.
 * @returns {Object} Validation result { valid, error, profile }
 * @throws {Error} Never throws.
 * @example
 * validateOnboarding({ commute: 'metro', diet: 'vegan', acUsage: 'often', recycling: true, onlineShopping: 'weekly' });
 */
function validateOnboarding(body) {
  if (!body) {
    return { valid: false, error: 'Onboarding body is missing' };
  }

  const { commute, diet, acUsage, recycling, onlineShopping } = body;

  const validCommutes = Object.keys(BASELINE_FACTORS.commute);
  if (typeof commute !== 'string' || !validCommutes.includes(commute)) {
    return { valid: false, error: `Invalid commute type: ${commute}` };
  }

  const validDiets = Object.keys(BASELINE_FACTORS.diet);
  if (typeof diet !== 'string' || !validDiets.includes(diet)) {
    return { valid: false, error: `Invalid diet type: ${diet}` };
  }

  const validAc = Object.keys(BASELINE_FACTORS.acUsage);
  if (typeof acUsage !== 'string' || !validAc.includes(acUsage)) {
    return { valid: false, error: `Invalid AC usage: ${acUsage}` };
  }

  if (typeof recycling !== 'boolean') {
    return { valid: false, error: 'Recycling must be a boolean value' };
  }

  const validShopping = ['rarely', 'weekly', 'daily'];
  if (typeof onlineShopping !== 'string' || !validShopping.includes(onlineShopping)) {
    return { valid: false, error: `Invalid online shopping: ${onlineShopping}` };
  }

  return {
    valid: true,
    profile: {
      commute: stripHtml(commute),
      diet: stripHtml(diet),
      acUsage: stripHtml(acUsage),
      recycling,
      onlineShopping: stripHtml(onlineShopping)
    }
  };
}

/**
 * Validates general messages.
 * @param {string} message - Message text.
 * @returns {Object} Validation result { valid, error, message }
 * @throws {Error} Never throws.
 * @example
 * validateMessage('Hello there');
 */
function validateMessage(message) {
  if (typeof message !== 'string' || message.trim() === '') {
    return { valid: false, error: 'Message must be a non-empty string' };
  }

  const stripped = stripHtml(message);
  if (stripped.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds limit of ${MAX_MESSAGE_LENGTH} characters` };
  }

  return {
    valid: true,
    message: stripped
  };
}

module.exports = {
  stripHtml,
  isValidString,
  sanitizeHtml,
  validateActivity,
  validateOnboarding,
  validateMessage
};
