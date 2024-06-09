/*
 * @adonisjs/health
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@poppinss/utils/string'

import { Result } from '../result.js'
import { BaseCheck } from '../base_check.js'
import type { HealthCheckResult } from '../types.js'

/**
 * Checks for the memory RSS size and report warning and errors after a
 * certain threshold is exceeded.
 */
export class MemoryRSSHealthCheck extends BaseCheck {
  #warnThreshold: number = stringHelpers.bytes.parse('200 mb')
  #failThreshold: number = stringHelpers.bytes.parse('350 mb')
  #computeFn: () => NodeJS.MemoryUsage = () => {
    return process.memoryUsage()
  }

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
   */
  warnWhenExceeds(value: string | number) {
    this.#warnThreshold = stringHelpers.bytes.parse(value)
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
   */
  failWhenExceeds(value: string | number) {
    this.#failThreshold = stringHelpers.bytes.parse(value)
    return this
  }

  /**
   * Define a custom callback to compute the RSS size. Defaults to
   * using "process.memoryUsage()" method call
   */
  compute(callback: () => NodeJS.MemoryUsage): this {
    this.#computeFn = callback
    return this
  }

  async run(): Promise<HealthCheckResult> {
    const { rss } = this.#computeFn()

    if (rss > this.#failThreshold) {
      return Result.failed(
        `RSS usage exceeded the "${stringHelpers.bytes.format(this.#failThreshold)}" threshold`
      ).mergeMetaData({
        bytes: {
          used: rss,
          threshold: this.#failThreshold,
        },
      })
    }

    if (rss > this.#warnThreshold) {
      return Result.warning(
        `RSS usage exceeded the "${stringHelpers.bytes.format(this.#warnThreshold)}" threshold`
      ).mergeMetaData({
        bytes: {
          used: rss,
          threshold: this.#warnThreshold,
        },
      })
    }

    return Result.ok('RSS usage is under defined thresholds').mergeMetaData({
      bytes: {
        used: rss,
      },
    })
  }
}
