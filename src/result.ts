/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HealthCheckResult } from './types.js'

/**
 * The result class offers a chainable API to create
 * HealthCheckResult
 */
export class Result implements HealthCheckResult {
  /**
   * Create result for success status
   */
  static ok(message: string): Result {
    return new Result(message, 'ok', new Date())
  }

  /**
   * Create result for failed status
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
   */
  static warning(message: string) {
    return new Result(message, 'warning', new Date())
  }

  declare meta?: HealthCheckResult['meta']

  constructor(
    public message: string,
    public status: HealthCheckResult['status'],
    public finishedAt: Date
  ) {}

  /**
   * Update the finished at timestamp for the result
   */
  setFinishedAt(finishedAt: Date) {
    this.finishedAt = finishedAt
    return this
  }

  /**
   * Define custom meta-data for the result. Calling this method will
   * override the existing meta-data
   */
  setMetaData(metaData: Record<string, any>) {
    this.meta = metaData
    return this
  }

  /**
   * Merge custom meta-data with the existing meta-data. A shallow
   * merge is performed
   */
  mergeMetaData(metaData: Record<string, any>) {
    this.meta = { ...this.meta, ...metaData }
    return this
  }

  toJSON(): HealthCheckResult {
    return {
      finishedAt: this.finishedAt,
      message: this.message,
      status: this.status,
      ...(this.meta ? { meta: this.meta } : {}),
    }
  }
}
