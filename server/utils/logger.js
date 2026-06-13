/**
 * @fileoverview Custom structured JSON logging utility.
 * @module server/utils/logger
 */

/**
 * Log an informational message.
 * @param {string} message - Message to log.
 * @param {Object} [meta] - Additional metadata.
 * @returns {void}
 * @throws {Error} Never throws.
 * @example
 * logger.info('Server started on port 8080');
 */
function info(message, meta = {}) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'carbon-saathi',
      message,
      ...meta
    })
  );
}

/**
 * Log a warning message.
 * @param {string} message - Message to log.
 * @param {Object} [meta] - Additional metadata.
 * @returns {void}
 * @throws {Error} Never throws.
 * @example
 * logger.warn('API quota near limit');
 */
function warn(message, meta = {}) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: 'carbon-saathi',
      message,
      ...meta
    })
  );
}

/**
 * Log an error message.
 * @param {string} message - Message to log.
 * @param {Object} [meta] - Additional metadata.
 * @returns {void}
 * @throws {Error} Never throws.
 * @example
 * logger.error('Database query failed', { error });
 */
function error(message, meta = {}) {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'carbon-saathi',
      message,
      ...meta
    })
  );
}

module.exports = {
  info,
  warn,
  error
};
