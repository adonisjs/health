/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HealthCheckResult } from './types.ts'

/**
 * The result class offers a chainable API to create
 * HealthCheckResult
 *
 * @example
 * ```typescript
 * import { Result } from '@adonisjs/health'
 *
 * // Success result
 * const success = Result.ok('Database connection is healthy')
 *
 * // Warning result
 * const warning = Result.warning('High memory usage detected')
 *
 * // Error result
 * const error = Result.failed('Database connection failed', new Error('Connection timeout'))
 *
 * // With metadata
 * const result = Result.ok('Service is running')
 *   .setMetaData({ responseTime: 120, uptime: 86400 })
 * ```
 */
export class Result implements HealthCheckResult {
  /**
   * Create result for success status
   *
   * @param message The success message
   *
   * @example
   * ```typescript
   * const result = Result.ok('Database connection is healthy')
   * ```
   */
  static ok(message: string): Result {
    return new Result(message, 'ok', new Date())
  }

  /**
   * Create result for failed status
   *
   * @param message The error message or Error object
   * @param error Optional error object when message is a string
   *
   * @example
   * ```typescript
   * const result1 = Result.failed('Database connection failed')
   * const result2 = Result.failed('Service error', new Error('Connection timeout'))
   * const result3 = Result.failed(new Error('Critical failure'))
   * ```
   */
  static failed(message: string, error?: Error): Result
  static failed(error: Error): Result
  static failed(message: string | Error, error?: Error): Result {
    const result = new Result(
      typeof message === 'string' ? message : message.message,
      'error',
      new Date()
    )

    if (error) {
      result.setMetaData({ error })
    }

    if (typeof message !== 'string') {
      result.setMetaData({ error: message })
    }

    return result
  }

  /**
   * Create result for warning status
   *
   * @param message The warning message
   *
   * @example
   * ```typescript
   * const result = Result.warning('Memory usage is above 80%')
   * ```
   */
  static warning(message: string) {
    return new Result(message, 'warning', new Date())
  }

  /**
   * Optional metadata associated with the result
   */
  declare meta?: HealthCheckResult['meta']

  /**
   * Creates a new Result instance
   *
   * @param message The result message
   * @param status The result status
   * @param finishedAt The timestamp when the check finished
   */
  constructor(
    public message: string,
    public status: HealthCheckResult['status'],
    public finishedAt: Date
  ) {}

  /**
   * Update the finished at timestamp for the result
   *
   * @param finishedAt The new finish timestamp
   *
   * @example
   * ```typescript
   * const result = Result.ok('Check completed')
   *   .setFinishedAt(new Date('2024-01-01T10:00:00Z'))
   * ```
   */
  setFinishedAt(finishedAt: Date) {
    this.finishedAt = finishedAt
    return this
  }

  /**
   * Define custom meta-data for the result. Calling this method will
   * override the existing meta-data
   *
   * @param metaData The metadata object to set
   *
   * @example
   * ```typescript
   * const result = Result.ok('Service is healthy')
   *   .setMetaData({ responseTime: 120, uptime: 86400 })
   * ```
   */
  setMetaData(metaData: Record<string, any>) {
    this.meta = metaData
    return this
  }

  /**
   * Merge custom meta-data with the existing meta-data. A shallow
   * merge is performed
   *
   * @param metaData The metadata object to merge
   *
   * @example
   * ```typescript
   * const result = Result.ok('Service is healthy')
   *   .setMetaData({ responseTime: 120 })
   *   .mergeMetaData({ uptime: 86400 })
   * // result.meta = { responseTime: 120, uptime: 86400 }
   * ```
   */
  mergeMetaData(metaData: Record<string, any>) {
    this.meta = { ...this.meta, ...metaData }
    return this
  }

  /**
   * Convert the result to a plain object
   *
   * @example
   * ```typescript
   * const result = Result.ok('Service is healthy')
   * const json = result.toJSON()
   * console.log(json) // { message: 'Service is healthy', status: 'ok', finishedAt: Date }
   * ```
   */
  toJSON(): HealthCheckResult {
    return {
      finishedAt: this.finishedAt,
      message: this.message,
      status: this.status,
      ...(this.meta ? { meta: this.meta } : {}),
    }
  }
}
