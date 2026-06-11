/**
 * @fileoverview Custom application error class.
 * @module server/utils/AppError
 */

/**
 * Custom application error class representing handled errors.
 * @extends Error
 */
class AppError extends Error {
  /**
   * Create an AppError.
   * @param {string} message - The error message.
   * @param {number} statusCode - HTTP status code.
   * @param {string} code - Application-specific error code.
   * @example
   * throw new AppError('Resource not found', 404, 'NOT_FOUND');
   */
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
