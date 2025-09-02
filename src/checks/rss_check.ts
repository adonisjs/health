/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'

import { Result } from '../result.ts'
import { BaseCheck } from '../base_check.ts'
import type { HealthCheckResult } from '../types.ts'

/**
 * Checks for the memory RSS size and report warning or error after a
 * certain threshold is exceeded.
 *
 * @example
 * ```typescript
 * const rssCheck = new MemoryRSSCheck()
 *   .as('RSS memory usage check')
 *   .warnWhenExceeds('300 mb')
 *   .failWhenExceeds('400 mb')
 *   .cacheFor('1 minute')
 *
 * const result = await rssCheck.run()
 * console.log(result.status) // 'ok' | 'warning' | 'error'
 * ```
 */
export class MemoryRSSCheck extends BaseCheck {
  /**
   * The warning threshold for RSS memory usage in bytes
   */
  #warnThreshold: number = stringHelpers.bytes.parse('320 mb')!

  /**
   * The failure threshold for RSS memory usage in bytes
   */
  #failThreshold: number = stringHelpers.bytes.parse('350 mb')!

  /**
   * Function to compute memory usage information
   */
  #computeFn: () => NodeJS.MemoryUsage = () => {
    return process.memoryUsage()
  }

  /**
   * The name of the memory RSS check
   */
  name: string = 'Memory RSS check'

  /**
   * Define the RSS threshold after which a warning
   * should be created.
   *
   * - The value should be either a number in bytes
   * - Or it should be a value expression in string.
   *
   * ```
   * .warnWhenExceeds('200 mb')
   * ```
   *
   * @param value The threshold value as bytes (number) or string expression
   */
  warnWhenExceeds(value: string | number) {
    this.#warnThreshold = stringHelpers.bytes.parse(value)!
    return this
  }

  /**
   * Define the RSS threshold after which an error
   * should be created.
   *
   * - The value should be either a number in bytes
   * - Or it should be a value expression in string.
   *
   * ```
   * .failWhenExceeds('500 mb')
   * ```
   *
   * @param value The threshold value as bytes (number) or string expression
   */
  failWhenExceeds(value: string | number) {
    this.#failThreshold = stringHelpers.bytes.parse(value)!
    return this
  }

  /**
   * Define a custom callback to compute the RSS size. Defaults to
   * using "process.memoryUsage()" method call
   *
   * @param callback Function that returns memory usage information
   *
   * @example
   * ```typescript
   * const rssCheck = new MemoryRSSCheck()
   *   .compute(() => {
   *     // Custom RSS computation logic
   *     const usage = process.memoryUsage()
   *     return { ...usage, rss: usage.rss * 0.9 } // Custom adjustment
   *   })
   * ```
   */
  compute(callback: () => NodeJS.MemoryUsage): this {
    this.#computeFn = callback
    return this
  }

  /**
   * Executes the RSS memory usage check
   */
  async run(): Promise<HealthCheckResult> {
    const { rss } = this.#computeFn()
    const metaData = {
      memoryInBytes: {
        used: rss,
        failureThreshold: this.#failThreshold,
        warningThreshold: this.#warnThreshold,
      },
    }

    if (rss > this.#failThreshold) {
      return Result.failed(
        `RSS usage is ${stringHelpers.bytes.format(rss)}, which is above the threshold of ${stringHelpers.bytes.format(this.#failThreshold)}`
      ).mergeMetaData(metaData)
    }

    if (rss > this.#warnThreshold) {
      return Result.warning(
        `RSS usage is ${stringHelpers.bytes.format(rss)}, which is above the threshold of ${stringHelpers.bytes.format(this.#warnThreshold)}`
      ).mergeMetaData(metaData)
    }

    return Result.ok('RSS usage is under defined thresholds').mergeMetaData(metaData)
  }
}
